using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Brand : BaseEntity, ISoftDelete
{
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Product> Products { get; set; } = new List<Product>();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
