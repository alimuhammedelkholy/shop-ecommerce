using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class NewsletterSubscriber : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? UnsubscribedAt { get; set; }
}
