using Shop.Domain.Common;
using Shop.Domain.Enums;

namespace Shop.Domain.Entities;

public class Payment : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public PaymentProvider Provider { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";

    /// <summary>Provider reference (e.g. Stripe PaymentIntent id). Never raw card data.</summary>
    public string? ProviderPaymentId { get; set; }
    public string? IdempotencyKey { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? PaidAt { get; set; }

    public ICollection<PaymentTransaction> Transactions { get; set; } = new List<PaymentTransaction>();
    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}
