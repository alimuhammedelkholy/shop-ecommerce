using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Pricing;
using Shop.Domain.Enums;

namespace Shop.Application.Marketing;

public sealed record CouponDto(string Code, string Type, decimal Value, string Description);
public sealed record ShippingMethodDto(int Id, string Name, string NameAr, string Description, string DescriptionAr, decimal Cost, decimal? FreeAbove, int MinDays, int MaxDays);

public interface ICouponService { Task<CouponDto> ValidateAsync(string code, decimal subtotal, CancellationToken ct); }
public interface IShippingService { Task<IReadOnlyList<ShippingMethodDto>> GetAsync(CancellationToken ct); }
public interface INewsletterService { Task SubscribeAsync(string email, CancellationToken ct); }

public sealed class CouponService(IApplicationDbContext db) : ICouponService
{
    public async Task<CouponDto> ValidateAsync(string code, decimal subtotal, CancellationToken ct)
    {
        var normalized = (code ?? string.Empty).Trim().ToUpperInvariant();
        var coupon = normalized.Length == 0 ? null : await db.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Code == normalized, ct);
        if (coupon is null) throw AppException.Validation("Coupon not found.", "coupon.invalid");

        var problem = CouponRules.Check(coupon, subtotal, DateTime.UtcNow);
        if (problem == "coupon.min")
            throw new AppException(ErrorKind.Validation, problem, "Order total is below the coupon minimum.",
                new Dictionary<string, object> { ["min"] = coupon.MinOrderAmount ?? 0m });
        if (problem is not null) throw AppException.Validation("Coupon is not valid.", problem);

        return new CouponDto(coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.Description ?? coupon.Code);
    }
}

public sealed class ShippingService(IApplicationDbContext db) : IShippingService
{
    public async Task<IReadOnlyList<ShippingMethodDto>> GetAsync(CancellationToken ct)
    {
        var methods = await db.ShippingMethods.AsNoTracking().Where(m => m.IsActive).OrderBy(m => m.SortOrder).ToListAsync(ct);
        return methods.Select(m => new ShippingMethodDto(
            m.Id, m.Name, m.NameAr,
            m.Description ?? $"Delivered in {m.EstimatedMinDays}-{m.EstimatedMaxDays} business days",
            $"التوصيل خلال {m.EstimatedMinDays}-{m.EstimatedMaxDays} أيام عمل",
            m.Cost, m.FreeAboveAmount, m.EstimatedMinDays, m.EstimatedMaxDays)).ToList();
    }
}

public sealed class NewsletterService(IApplicationDbContext db) : INewsletterService
{
    public async Task SubscribeAsync(string email, CancellationToken ct)
    {
        email = (email ?? string.Empty).Trim().ToLowerInvariant();
        if (!Validation.IsEmail(email)) throw AppException.Validation("Enter a valid email address.");

        var existing = await db.NewsletterSubscribers.FirstOrDefaultAsync(s => s.Email == email, ct);
        if (existing is null) db.NewsletterSubscribers.Add(new() { Email = email });
        else if (!existing.IsActive) { existing.IsActive = true; existing.UnsubscribedAt = null; }
        else return; // already subscribed: idempotent

        await db.SaveChangesAsync(ct);
    }
}
