using Shop.Domain.Common;

namespace Shop.Domain.Entities;

/// <summary>Line item with a snapshot of name, SKU and price so later catalog edits never change order history.</summary>
public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = null!;

    /// <summary>Denormalised product id (no FK) so sales reports survive product soft-deletion.</summary>
    public int ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? VariantDescription { get; set; }
    public string? ImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}
