namespace Shop.Domain.Enums;

public enum PaymentStatus
{
    Pending,
    RequiresAction,
    Authorized,
    Paid,
    Failed,
    Cancelled,
    PartiallyRefunded,
    Refunded
}
