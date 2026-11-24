using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class ShippingMethod : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Cost { get; set; }
    public decimal? FreeAboveAmount { get; set; }
    public int EstimatedMinDays { get; set; }
    public int EstimatedMaxDays { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
