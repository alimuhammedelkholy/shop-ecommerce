using Microsoft.AspNetCore.Mvc;
using Shop.Application.Catalog;
using Shop.Application.Common;

namespace Shop.Api.Controllers;

public sealed class ProductSearchParams
{
    public string? Q { get; set; }
    public string? Category { get; set; }
    /// <summary>Comma separated brand slugs.</summary>
    public string? Brands { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinRating { get; set; }
    public bool OnSale { get; set; }
    public string Sort { get; set; } = "featured";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

[ApiController]
[Route("api")]
public sealed class CatalogController(ICatalogService catalog) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<IReadOnlyList<CategoryDto>> Categories(CancellationToken ct) => await catalog.GetCategoriesAsync(ct);

    [HttpGet("brands")]
    public async Task<IReadOnlyList<BrandDto>> Brands(CancellationToken ct) => await catalog.GetBrandsAsync(ct);

    [HttpGet("products")]
    public async Task<PagedResult<ProductDto>> Products([FromQuery] ProductSearchParams p, CancellationToken ct) =>
        await catalog.SearchAsync(new ProductQuery
        {
            Q = p.Q, Category = p.Category,
            Brands = (p.Brands ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            MinPrice = p.MinPrice, MaxPrice = p.MaxPrice, MinRating = p.MinRating, OnSale = p.OnSale,
            Sort = p.Sort, Page = p.Page, PageSize = p.PageSize,
        }, ct);

    [HttpGet("products/by-ids")]
    public async Task<IReadOnlyList<ProductDto>> ByIds([FromQuery] string ids, CancellationToken ct)
    {
        var parsed = (ids ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var n) ? n : 0).Where(n => n > 0).ToList();
        return await catalog.GetByIdsAsync(parsed, ct);
    }

    [HttpGet("products/{slug}")]
    public async Task<ProductDto> Product(string slug, CancellationToken ct) => await catalog.GetBySlugAsync(slug, ct);

    [HttpGet("products/{id:int}/related")]
    public async Task<IReadOnlyList<ProductDto>> Related(int id, CancellationToken ct) => await catalog.GetRelatedAsync(id, ct);

    [HttpGet("search/suggest")]
    public async Task<SuggestionsDto> Suggest([FromQuery] string q, CancellationToken ct) => await catalog.SuggestAsync(q ?? string.Empty, ct);
}
