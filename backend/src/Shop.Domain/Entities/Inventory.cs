using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Inventory : BaseEntity
{
    public int ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = null!;

    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int LowStockThreshold { get; set; } = 5;

    /// <summary>Optimistic concurrency token; prevents two checkouts from overselling the same stock.</summary>
    public byte[] RowVersion { get; set; } = [];

    public int QuantityAvailable => QuantityOnHand - QuantityReserved;
    public bool IsLowStock => QuantityAvailable <= LowStockThreshold;
}
