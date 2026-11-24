using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Sku { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? ColorHex { get; set; }
    public string? Size { get; set; }

    /// <summary>When set, overrides the product's <c>BasePrice</c> for this variant.</summary>
    public decimal? PriceOverride { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public Inventory? Inventory { get; set; }
}
