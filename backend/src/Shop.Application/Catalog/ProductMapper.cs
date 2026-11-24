using Shop.Application.Common;
using Shop.Domain.Entities;

namespace Shop.Application.Catalog;

internal static class ProductMapper
{
    public static CategoryDto ToDto(this Category c, string? parentSlug) =>
        new(c.Id, c.Name, c.NameAr, c.Slug, Presentation.GlyphFor(c.Slug), Presentation.HueFor(c.Slug), parentSlug);

    public static BrandDto ToDto(this Brand b) => new(b.Id, b.Name, b.NameAr, b.Slug);

    /// <summary>Expects Category, Brand, Images, Specifications and Variants.Inventory to be loaded.</summary>
    public static ProductDto ToDto(this Product p)
    {
        var specs = p.Specifications.OrderBy(s => s.SortOrder).Select(s => new SpecDto(s.Name, s.NameAr, s.Value)).ToList();
        var specsAr = p.Specifications.OrderBy(s => s.SortOrder).Take(4).Select(s => $"{s.NameAr}: {s.ValueAr}").ToList();
        var slug = p.Category?.Slug;

        return new ProductDto(
            p.Id, p.Name, p.NameAr, p.Slug, p.Description ?? string.Empty, p.DescriptionAr ?? p.Description ?? string.Empty,
            p.BasePrice, p.CompareAtPrice, p.IsFeatured, p.TotalSold, p.AverageRating, p.ReviewCount,
            p.CategoryId, slug ?? string.Empty, p.Category?.Name ?? string.Empty, p.Category?.NameAr ?? string.Empty,
            p.BrandId ?? 0, p.Brand?.Slug ?? string.Empty, p.Brand?.Name ?? string.Empty, p.Brand?.NameAr ?? string.Empty,
            p.CreatedAt, Presentation.HueFor(p.Slug), Presentation.GlyphFor(slug),
            p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).Select(i => i.Url).ToList(),
            p.Variants.Where(v => v.IsActive).OrderBy(v => v.SortOrder)
                .Select(v => new VariantDto(v.Id, v.Sku, v.Color, v.ColorHex, v.Size, v.PriceOverride,
                    Math.Max(0, v.Inventory?.QuantityAvailable ?? 0)))
                .ToList(),
            specs,
            specs.Take(4).Select(s => $"{s.Name}: {s.Value}").ToList(),
            specsAr);
    }
}
