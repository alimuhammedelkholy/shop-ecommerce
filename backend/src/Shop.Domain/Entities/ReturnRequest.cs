using Shop.Domain.Common;
using Shop.Domain.Enums;

namespace Shop.Domain.Entities;

public class ReturnRequest : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = null!;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
    public ReturnStatus Status { get; set; } = ReturnStatus.Requested;
    public string? AdminNote { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}
