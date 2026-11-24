using Shop.Domain.Entities;

namespace Shop.Application.Pricing;

public static class CouponRules
{
    /// <summary>Returns null when the coupon can be used, otherwise the translation key explaining why not.</summary>
    public static string? Check(Coupon coupon, decimal subtotal, DateTime utcNow)
    {
        if (!coupon.IsActive) return "coupon.invalid";
        if (coupon.StartsAt is { } s && utcNow < s) return "coupon.invalid";
        if (coupon.ExpiresAt is { } e && utcNow > e) return "coupon.invalid";
        if (coupon.UsageLimit is { } limit && coupon.UsedCount >= limit) return "coupon.invalid";
        if (coupon.MinOrderAmount is { } min && subtotal < min) return "coupon.min";
        return null;
    }
}
