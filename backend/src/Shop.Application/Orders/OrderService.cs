using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Pricing;
using Shop.Domain.Entities;
using Shop.Domain.Enums;
using Shop.Domain.ValueObjects;

namespace Shop.Application.Orders;

public interface IOrderService
{
    Task<OrderDto> PlaceAsync(PlaceOrderRequest request, string? idempotencyKey, CancellationToken ct);
    Task<IReadOnlyList<OrderDto>> ListMineAsync(CancellationToken ct);
    /// <summary>Owner access when signed in; otherwise the order e-mail must be supplied (guest checkout).</summary>
    Task<OrderDto> GetAsync(string number, string? guestEmail, CancellationToken ct);
}

public sealed class OrderService(IApplicationDbContext db, ICurrentUser user, IPaymentGateway payments) : IOrderService
{
    private const int MaxQtyPerLine = 20;

    public async Task<OrderDto> PlaceAsync(PlaceOrderRequest request, string? idempotencyKey, CancellationToken ct)
    {
        Validate(request);

        // Replaying the same Idempotency-Key returns the original order instead of charging twice.
        idempotencyKey = string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey.Trim()[..Math.Min(idempotencyKey.Trim().Length, 100)];
        if (idempotencyKey is not null)
        {
            var existing = await db.Payments.AsNoTracking().Where(p => p.IdempotencyKey == idempotencyKey).Select(p => p.OrderId).FirstOrDefaultAsync(ct);
            if (existing != 0) return await LoadDtoAsync(db.Orders.Where(o => o.Id == existing), ct);
        }

        if (!Enum.TryParse<PaymentProvider>(request.Payment, true, out var provider))
            throw AppException.Validation("Unknown payment method.");

        // Merge duplicate variants, then load them with product + stock.
        var wanted = request.Lines.GroupBy(l => l.VariantId).ToDictionary(g => g.Key, g => g.Sum(x => x.Qty));
        var variantIds = wanted.Keys.ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product).ThenInclude(p => p.Images)
            .Include(v => v.Inventory)
            .Where(v => variantIds.Contains(v.Id) && v.IsActive && v.Product.IsActive)
            .ToListAsync(ct);
        if (variants.Count != variantIds.Count) throw AppException.Validation("One or more items are no longer available.", "error.generic");

        var shipping = await db.ShippingMethods.FirstOrDefaultAsync(m => m.Id == request.ShippingMethodId && m.IsActive, ct)
            ?? throw AppException.Validation("Unknown shipping method.");

        var items = new List<OrderItem>();
        foreach (var v in variants)
        {
            var qty = wanted[v.Id];
            if (qty > MaxQtyPerLine) throw AppException.Validation($"At most {MaxQtyPerLine} units per item.");
            var inv = v.Inventory;
            if (inv is null || inv.QuantityAvailable < qty)
                throw AppException.Conflict("stock.insufficient", $"Not enough stock for {v.Product.Name}.");

            inv.QuantityReserved += qty; // reserve now; fulfilment decrements on-hand later
            var price = v.PriceOverride ?? v.Product.BasePrice; // never trust client prices
            items.Add(new OrderItem
            {
                ProductVariantId = v.Id, ProductId = v.ProductId, ProductName = v.Product.Name, Sku = v.Sku,
                VariantDescription = string.Join(" / ", new[] { v.Color, v.Size }.Where(s => !string.IsNullOrWhiteSpace(s))),
                ImageUrl = v.Product.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                UnitPrice = price, Quantity = qty, LineTotal = Math.Round(price * qty, 2),
            });
        }

        var subtotal = items.Sum(i => i.LineTotal);

        Coupon? coupon = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var code = request.CouponCode.Trim().ToUpperInvariant();
            coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Code == code, ct)
                ?? throw AppException.Validation("Coupon not found.", "coupon.invalid");
            var problem = CouponRules.Check(coupon, subtotal, DateTime.UtcNow);
            if (problem is not null) throw AppException.Validation("Coupon is not valid.", problem);
            coupon.UsedCount++;
        }

        var totals = PricingCalculator.Calculate(subtotal, coupon, shipping.Cost, shipping.FreeAboveAmount);

        var order = new Order
        {
            OrderNumber = $"SH-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(100000, 999999)}",
            UserId = user.UserId,
            CustomerEmail = request.Email.Trim().ToLowerInvariant(),
            CustomerPhone = request.Address.Phone.Trim(),
            Currency = "USD",
            Subtotal = totals.Subtotal, DiscountTotal = totals.Discount, ShippingTotal = totals.Shipping, GrandTotal = totals.Total,
            CouponId = coupon?.Id, CouponCode = coupon?.Code,
            ShippingMethodId = shipping.Id, ShippingMethodName = shipping.Name,
            ShippingAddress = new OrderAddress
            {
                FullName = request.Address.FullName.Trim(), Phone = request.Address.Phone.Trim(), Line1 = request.Address.Line1.Trim(),
                City = request.Address.City.Trim(), State = request.Address.Region?.Trim(),
                PostalCode = request.Address.PostalCode?.Trim(), CountryCode = request.Address.Country.Trim().ToUpperInvariant(),
            },
            PlacedAt = DateTime.UtcNow,
            Items = items,
        };

        var payment = new Payment
        {
            Provider = provider, Amount = totals.Total, Currency = order.Currency, IdempotencyKey = idempotencyKey,
            Status = PaymentStatus.Pending,
        };

        if (provider != PaymentProvider.CashOnDelivery)
        {
            var result = await payments.ChargeAsync(new PaymentRequest(order.OrderNumber, provider, totals.Total, order.Currency), ct);
            if (!result.Succeeded) throw AppException.Validation(result.FailureReason ?? "Payment failed.", "payment.failed");

            payment.ProviderPaymentId = result.ProviderPaymentId;
            payment.Status = result.Captured ? PaymentStatus.Paid : PaymentStatus.Authorized;
            payment.PaidAt = result.Captured ? DateTime.UtcNow : null;
            order.PaymentStatus = payment.Status;
            order.Status = OrderStatus.Confirmed;
        }
        order.Payments.Add(payment);

        db.Orders.Add(order);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another checkout took the last units between our read and write.
            throw AppException.Conflict("stock.insufficient", "Stock changed while placing the order. Please review your cart.");
        }

        return await LoadDtoAsync(db.Orders.Where(o => o.Id == order.Id), ct);
    }

    public async Task<IReadOnlyList<OrderDto>> ListMineAsync(CancellationToken ct)
    {
        var userId = user.UserId ?? throw AppException.Unauthorized("error.unauthorized", "Sign in required.");
        var orders = await db.Orders.AsNoTracking().Include(o => o.Items).Include(o => o.Payments)
            .Where(o => o.UserId == userId).OrderByDescending(o => o.PlacedAt).Take(100).ToListAsync(ct);
        return await MapAsync(orders, ct);
    }

    public async Task<OrderDto> GetAsync(string number, string? guestEmail, CancellationToken ct)
    {
        var order = await db.Orders.AsNoTracking().Include(o => o.Items).Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.OrderNumber == number, ct);

        var owner = order is not null && user.UserId is { } uid && order.UserId == uid;
        var guest = order is not null && !string.IsNullOrWhiteSpace(guestEmail)
            && string.Equals(order.CustomerEmail, guestEmail.Trim(), StringComparison.OrdinalIgnoreCase);

        // Same answer for "missing" and "not yours" so order numbers cannot be probed.
        if (order is null || !(owner || guest)) throw AppException.NotFound("Order not found.");
        return (await MapAsync([order], ct))[0];
    }

    private async Task<OrderDto> LoadDtoAsync(IQueryable<Order> query, CancellationToken ct)
    {
        var order = await query.AsNoTracking().Include(o => o.Items).Include(o => o.Payments).FirstAsync(ct);
        return (await MapAsync([order], ct))[0];
    }

    private async Task<IReadOnlyList<OrderDto>> MapAsync(IReadOnlyList<Order> orders, CancellationToken ct)
    {
        var productIds = orders.SelectMany(o => o.Items).Select(i => i.ProductId).Distinct().ToList();
        // Soft-deleted products must still render in order history.
        var products = await db.Products.IgnoreQueryFilters().AsNoTracking().Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        var methodIds = orders.Where(o => o.ShippingMethodId != null).Select(o => o.ShippingMethodId!.Value).Distinct().ToList();
        var methodAr = await db.ShippingMethods.AsNoTracking().Where(m => methodIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id, m => m.NameAr, ct);

        return orders.Select(o => new OrderDto(
            o.OrderNumber, o.OrderNumber, o.PlacedAt, o.Status.ToString(), o.CustomerEmail,
            new OrderAddressDto(o.ShippingAddress.FullName, o.ShippingAddress.Phone, o.ShippingAddress.Line1, o.ShippingAddress.City,
                o.ShippingAddress.State ?? string.Empty, o.ShippingAddress.PostalCode, o.ShippingAddress.CountryCode),
            o.Items.Select(i =>
            {
                products.TryGetValue(i.ProductId, out var p);
                return new OrderLineDto(i.ProductId, p?.Slug ?? string.Empty, i.ProductName, p?.NameAr ?? i.ProductName,
                    i.VariantDescription ?? string.Empty, i.UnitPrice, i.Quantity,
                    Presentation.HueFor(p?.Slug), Presentation.GlyphFor(p?.Category?.Slug));
            }).ToList(),
            o.Subtotal, o.DiscountTotal, o.ShippingTotal, o.GrandTotal,
            o.ShippingMethodName, o.ShippingMethodId is { } mid && methodAr.TryGetValue(mid, out var ar) ? ar : o.ShippingMethodName,
            (o.Payments.OrderBy(p => p.Id).FirstOrDefault()?.Provider ?? PaymentProvider.CashOnDelivery).ToString(),
            o.CouponCode)).ToList();
    }

    private static void Validate(PlaceOrderRequest r)
    {
        if (r.Lines is null || r.Lines.Count == 0) throw AppException.Validation("Your cart is empty.", "error.emptyCart");
        if (r.Lines.Any(l => l.Qty < 1 || l.Qty > MaxQtyPerLine)) throw AppException.Validation("Invalid quantity.");
        if (!Validation.IsEmail(r.Email?.Trim())) throw AppException.Validation("Enter a valid email address.");

        var a = r.Address ?? throw AppException.Validation("Shipping address is required.");
        if (string.IsNullOrWhiteSpace(a.FullName) || string.IsNullOrWhiteSpace(a.Phone) || string.IsNullOrWhiteSpace(a.Line1)
            || string.IsNullOrWhiteSpace(a.City) || a.Country is not { Length: 2 })
            throw AppException.Validation("Shipping address is incomplete.");
        if (a.FullName.Length > 150 || a.Phone.Length > 30 || a.Line1.Length > 200 || a.City.Length > 100)
            throw AppException.Validation("A shipping address field is too long.");
    }
}
