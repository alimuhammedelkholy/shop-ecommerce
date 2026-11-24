using Shop.Application.Pricing;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.UnitTests.Application;

public class PricingCalculatorTests
{
    [Fact]
    public void No_coupon_adds_shipping_to_subtotal()
    {
        var t = PricingCalculator.Calculate(80m, null, 5m, 100m);
        Assert.Equal(80m, t.Subtotal);
        Assert.Equal(0m, t.Discount);
        Assert.Equal(5m, t.Shipping);
        Assert.Equal(85m, t.Total);
    }

    [Fact]
    public void Shipping_is_free_at_or_above_the_threshold()
    {
        var t = PricingCalculator.Calculate(100m, null, 5m, 100m);
        Assert.Equal(0m, t.Shipping);
        Assert.Equal(100m, t.Total);
    }

    [Fact]
    public void Percentage_coupon_is_rounded_and_capped()
    {
        var coupon = new Coupon { Type = CouponType.Percentage, Value = 10m, MaxDiscountAmount = 5m };
        var t = PricingCalculator.Calculate(123.45m, coupon, 0m, null);
        Assert.Equal(5m, t.Discount);
        Assert.Equal(118.45m, t.Total);

        var uncapped = PricingCalculator.Calculate(123.45m, new Coupon { Type = CouponType.Percentage, Value = 10m }, 0m, null);
        Assert.Equal(12.35m, uncapped.Discount); // 12.345 rounds away from zero
    }

    [Fact]
    public void Fixed_coupon_never_exceeds_the_subtotal()
    {
        var t = PricingCalculator.Calculate(15m, new Coupon { Type = CouponType.FixedAmount, Value = 20m }, 0m, null);
        Assert.Equal(15m, t.Discount);
        Assert.Equal(0m, t.Total);
    }

    [Fact]
    public void Free_shipping_coupon_removes_shipping_only()
    {
        var t = PricingCalculator.Calculate(40m, new Coupon { Type = CouponType.FreeShipping }, 12m, null);
        Assert.Equal(0m, t.Discount);
        Assert.Equal(0m, t.Shipping);
        Assert.Equal(40m, t.Total);
    }
}

public class CouponRulesTests
{
    private static readonly DateTime Now = new(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Valid_coupon_passes() =>
        Assert.Null(CouponRules.Check(new Coupon { IsActive = true }, 50m, Now));

    [Fact]
    public void Inactive_expired_and_exhausted_coupons_are_invalid()
    {
        Assert.Equal("coupon.invalid", CouponRules.Check(new Coupon { IsActive = false }, 50m, Now));
        Assert.Equal("coupon.invalid", CouponRules.Check(new Coupon { ExpiresAt = Now.AddDays(-1) }, 50m, Now));
        Assert.Equal("coupon.invalid", CouponRules.Check(new Coupon { StartsAt = Now.AddDays(1) }, 50m, Now));
        Assert.Equal("coupon.invalid", CouponRules.Check(new Coupon { UsageLimit = 3, UsedCount = 3 }, 50m, Now));
    }

    [Fact]
    public void Minimum_order_is_enforced() =>
        Assert.Equal("coupon.min", CouponRules.Check(new Coupon { MinOrderAmount = 100m }, 99.99m, Now));
}
