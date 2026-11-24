using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Cart : BaseEntity
{
    /// <summary>Owner for authenticated carts; null for guest carts identified by <see cref="GuestToken"/>.</summary>
    public Guid? UserId { get; set; }
    public string? GuestToken { get; set; }

    public int? CouponId { get; set; }
    public Coupon? Coupon { get; set; }

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
