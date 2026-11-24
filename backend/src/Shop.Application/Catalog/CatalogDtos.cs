namespace Shop.Application.Catalog;

public sealed record CategoryDto(int Id, string Name, string NameAr, string Slug, string Glyph, int Hue, string? ParentSlug);
public sealed record BrandDto(int Id, string Name, string NameAr, string Slug);
public sealed record VariantDto(int Id, string Sku, string? Color, string? ColorHex, string? Size, decimal? PriceOverride, int Stock);
public sealed record SpecDto(string Name, string NameAr, string Value);

public sealed record ProductDto(
    int Id, string Name, string NameAr, string Slug, string Description, string DescriptionAr,
    decimal BasePrice, decimal? CompareAtPrice, bool IsFeatured, int TotalSold, decimal AverageRating, int ReviewCount,
    int CategoryId, string CategorySlug, string CategoryName, string CategoryNameAr,
    int BrandId, string BrandSlug, string BrandName, string BrandNameAr,
    DateTime CreatedAt, int Hue, string Glyph, IReadOnlyList<string> Images,
    IReadOnlyList<VariantDto> Variants, IReadOnlyList<SpecDto> Specifications,
    IReadOnlyList<string> Highlights, IReadOnlyList<string> HighlightsAr);

public sealed record SuggestionsDto(IReadOnlyList<ProductDto> Products, IReadOnlyList<CategoryDto> Categories);

public sealed class ProductQuery
{
    public string? Q { get; init; }
    public string? Category { get; init; }
    public IReadOnlyList<string> Brands { get; init; } = [];
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public decimal? MinRating { get; init; }
    public bool OnSale { get; init; }
    public string Sort { get; init; } = "featured";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
}
