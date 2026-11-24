using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Wishlist : BaseEntity
{
    public Guid UserId { get; set; }
    public ICollection<WishlistItem> Items { get; set; } = new List<WishlistItem>();
}
