using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Product : BaseEntity, ISoftDelete
{
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DescriptionAr { get; set; }

    /// <summary>Current selling price in the store's base currency.</summary>
    public decimal BasePrice { get; set; }

    /// <summary>Original price; when greater than <see cref="BasePrice"/> the product is on sale.</summary>
    public decimal? CompareAtPrice { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }

    // Denormalised counters kept up to date by application services (used for sorting and badges).
    public int TotalSold { get; set; }
    public int ViewCount { get; set; }
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public int? BrandId { get; set; }
    public Brand? Brand { get; set; }

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductSpecification> Specifications { get; set; } = new List<ProductSpecification>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
