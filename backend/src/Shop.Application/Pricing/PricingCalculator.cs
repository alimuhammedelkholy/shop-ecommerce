using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Pricing;

public sealed record OrderTotals(decimal Subtotal, decimal Discount, decimal Shipping, decimal Total);

/// <summary>Pure pricing rules. Money is rounded to 2 decimals, away from zero.</summary>
public static class PricingCalculator
{
    public static OrderTotals Calculate(decimal subtotal, Coupon? coupon, decimal shippingCost, decimal? freeShippingAbove)
    {
        subtotal = Round(subtotal);
        var shipping = freeShippingAbove is { } threshold && subtotal >= threshold ? 0m : shippingCost;
        var discount = 0m;

        if (coupon is not null)
        {
            switch (coupon.Type)
            {
                case CouponType.Percentage:
                    discount = subtotal * coupon.Value / 100m;
                    if (coupon.MaxDiscountAmount is { } cap) discount = Math.Min(discount, cap);
                    break;
                case CouponType.FixedAmount:
                    discount = Math.Min(coupon.Value, subtotal);
                    break;
                case CouponType.FreeShipping:
                    shipping = 0m;
                    break;
            }
        }

        discount = Round(Math.Min(discount, subtotal));
        shipping = Round(shipping);
        return new OrderTotals(subtotal, discount, shipping, Round(subtotal - discount + shipping));
    }

    private static decimal Round(decimal v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);
}
