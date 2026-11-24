namespace Shop.Application.Orders;

public sealed record OrderAddressDto(string FullName, string Phone, string Line1, string City, string Region, string? PostalCode, string Country);
public sealed record OrderLineRequest(int ProductId, int VariantId, int Qty);

public sealed record PlaceOrderRequest(
    string Email, OrderAddressDto Address, int ShippingMethodId, string Payment, string? CouponCode,
    IReadOnlyList<OrderLineRequest> Lines);

public sealed record OrderLineDto(int ProductId, string Slug, string Name, string NameAr, string VariantLabel, decimal Price, int Qty, int Hue, string Glyph);

public sealed record OrderDto(
    string Id, string Number, DateTime CreatedAt, string Status, string Email, OrderAddressDto Address,
    IReadOnlyList<OrderLineDto> Lines, decimal Subtotal, decimal Discount, decimal Shipping, decimal Total,
    string ShippingMethod, string ShippingMethodAr, string Payment, string? CouponCode);
