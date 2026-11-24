using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Domain.Entities;

namespace Shop.Application.Catalog;

public interface ICatalogService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct);
    Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken ct);
    Task<PagedResult<ProductDto>> SearchAsync(ProductQuery query, CancellationToken ct);
    Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct);
    Task<IReadOnlyList<ProductDto>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken ct);
    Task<IReadOnlyList<ProductDto>> GetRelatedAsync(int productId, CancellationToken ct);
    Task<SuggestionsDto> SuggestAsync(string term, CancellationToken ct);
}

public sealed class CatalogService(IApplicationDbContext db) : ICatalogService
{
    private const int MaxPageSize = 60;

    private IQueryable<Product> Detailed() => db.Products
        .AsNoTracking()
        .Where(p => p.IsActive)
        .Include(p => p.Category)
        .Include(p => p.Brand)
        .Include(p => p.Images)
        .Include(p => p.Specifications)
        .Include(p => p.Variants).ThenInclude(v => v.Inventory);

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct)
    {
        var all = await db.Categories.AsNoTracking().Where(c => c.IsActive).OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(ct);
        var slugById = all.ToDictionary(c => c.Id, c => c.Slug);
        return all.Select(c => c.ToDto(c.ParentId is { } pid && slugById.TryGetValue(pid, out var s) ? s : null)).ToList();
    }

    public async Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken ct) =>
        (await db.Brands.AsNoTracking().Where(b => b.IsActive).OrderBy(b => b.Name).ToListAsync(ct)).Select(b => b.ToDto()).ToList();

    public async Task<PagedResult<ProductDto>> SearchAsync(ProductQuery q, CancellationToken ct)
    {
        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, MaxPageSize);

        var categories = await db.Categories.AsNoTracking().ToListAsync(ct);
        var brands = await db.Brands.AsNoTracking().ToListAsync(ct);

        // "Base" filters (everything except category + brand) drive the facet counts.
        var baseQuery = db.Products.AsNoTracking().Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(q.Q))
        {
            var like = $"%{EscapeLike(q.Q.Trim())}%";
            baseQuery = baseQuery.Where(p =>
                EF.Functions.Like(p.Name, like) || EF.Functions.Like(p.NameAr, like) ||
                (p.Brand != null && (EF.Functions.Like(p.Brand.Name, like) || EF.Functions.Like(p.Brand.NameAr, like))));
        }
        if (q.MinPrice is { } min) baseQuery = baseQuery.Where(p => p.BasePrice >= min);
        if (q.MaxPrice is { } max) baseQuery = baseQuery.Where(p => p.BasePrice <= max);
        if (q.MinRating is { } rating) baseQuery = baseQuery.Where(p => p.AverageRating >= rating);
        if (q.OnSale) baseQuery = baseQuery.Where(p => p.CompareAtPrice != null && p.CompareAtPrice > p.BasePrice);

        // Facets over the base set.
        var catCounts = await baseQuery.GroupBy(p => p.CategoryId).Select(g => new { Id = g.Key, N = g.Count() }).ToListAsync(ct);
        var brandCounts = await baseQuery.Where(p => p.BrandId != null).GroupBy(p => p.BrandId!.Value)
            .Select(g => new { Id = g.Key, N = g.Count() }).ToListAsync(ct);
        var bounds = await baseQuery.GroupBy(_ => 1).Select(g => new { Min = g.Min(p => p.BasePrice), Max = g.Max(p => p.BasePrice) }).FirstOrDefaultAsync(ct);

        var byId = categories.ToDictionary(c => c.Id);
        var catFacet = new Dictionary<string, int>();
        foreach (var c in catCounts)
        {
            if (!byId.TryGetValue(c.Id, out var cat)) continue;
            catFacet[cat.Slug] = catFacet.GetValueOrDefault(cat.Slug) + c.N;
            if (cat.ParentId is { } pid && byId.TryGetValue(pid, out var parent))
                catFacet[parent.Slug] = catFacet.GetValueOrDefault(parent.Slug) + c.N;
        }
        var brandSlugById = brands.ToDictionary(b => b.Id, b => b.Slug);
        var brandFacet = brandCounts.Where(b => brandSlugById.ContainsKey(b.Id)).ToDictionary(b => brandSlugById[b.Id], b => b.N);

        // Category + brand filters on top.
        var filtered = baseQuery;
        if (!string.IsNullOrWhiteSpace(q.Category))
        {
            var root = categories.FirstOrDefault(c => c.Slug == q.Category);
            var ids = root is null
                ? new List<int> { -1 }
                : categories.Where(c => c.Id == root.Id || c.ParentId == root.Id).Select(c => c.Id).ToList();
            filtered = filtered.Where(p => ids.Contains(p.CategoryId));
        }
        if (q.Brands.Count > 0)
        {
            var brandIds = brands.Where(b => q.Brands.Contains(b.Slug)).Select(b => b.Id).DefaultIfEmpty(-1).ToList();
            filtered = filtered.Where(p => p.BrandId != null && brandIds.Contains(p.BrandId.Value));
        }

        var total = await filtered.CountAsync(ct);

        IOrderedQueryable<Product> ordered = q.Sort switch
        {
            "newest" => filtered.OrderByDescending(p => p.CreatedAt),
            "price-asc" => filtered.OrderBy(p => p.BasePrice),
            "price-desc" => filtered.OrderByDescending(p => p.BasePrice),
            "rating" => filtered.OrderByDescending(p => p.AverageRating).ThenByDescending(p => p.ReviewCount),
            "popular" => filtered.OrderByDescending(p => p.TotalSold),
            _ => filtered.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.TotalSold),
        };

        var pageIds = await ordered.ThenBy(p => p.Id).Skip((page - 1) * pageSize).Take(pageSize).Select(p => p.Id).ToListAsync(ct);
        var items = await LoadInOrderAsync(pageIds, ct);

        return new PagedResult<ProductDto>(items, total, page, pageSize, Math.Max(1, (int)Math.Ceiling(total / (double)pageSize)),
            new Facets(catFacet, brandFacet, bounds?.Min ?? 0, bounds?.Max ?? 0));
    }

    public async Task<ProductDto> GetBySlugAsync(string slug, CancellationToken ct)
    {
        var p = await Detailed().FirstOrDefaultAsync(x => x.Slug == slug, ct) ?? throw AppException.NotFound("Product not found.");
        return p.ToDto();
    }

    public Task<IReadOnlyList<ProductDto>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken ct) =>
        LoadInOrderAsync(ids.Distinct().Take(50).ToList(), ct);

    public async Task<IReadOnlyList<ProductDto>> GetRelatedAsync(int productId, CancellationToken ct)
    {
        var source = await db.Products.AsNoTracking().Where(p => p.Id == productId).Select(p => new { p.CategoryId, p.BrandId }).FirstOrDefaultAsync(ct)
            ?? throw AppException.NotFound("Product not found.");

        var ids = await db.Products.AsNoTracking()
            .Where(p => p.IsActive && p.Id != productId && (p.CategoryId == source.CategoryId || (source.BrandId != null && p.BrandId == source.BrandId)))
            .OrderByDescending(p => p.CategoryId == source.CategoryId).ThenByDescending(p => p.TotalSold).ThenBy(p => p.Id)
            .Select(p => p.Id).Take(8).ToListAsync(ct);
        return await LoadInOrderAsync(ids, ct);
    }

    public async Task<SuggestionsDto> SuggestAsync(string term, CancellationToken ct)
    {
        term = term.Trim();
        if (term.Length < 2) return new SuggestionsDto([], []);

        var like = $"%{EscapeLike(term)}%";
        var ids = await db.Products.AsNoTracking()
            .Where(p => p.IsActive && (EF.Functions.Like(p.Name, like) || EF.Functions.Like(p.NameAr, like)))
            .OrderByDescending(p => p.TotalSold).Select(p => p.Id).Take(5).ToListAsync(ct);
        var cats = await db.Categories.AsNoTracking()
            .Where(c => c.IsActive && (EF.Functions.Like(c.Name, like) || EF.Functions.Like(c.NameAr, like))).Take(3).ToListAsync(ct);
        var slugById = await db.Categories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Slug, ct);

        return new SuggestionsDto(
            await LoadInOrderAsync(ids, ct),
            cats.Select(c => c.ToDto(c.ParentId is { } pid && slugById.TryGetValue(pid, out var s) ? s : null)).ToList());
    }

    private async Task<IReadOnlyList<ProductDto>> LoadInOrderAsync(IReadOnlyList<int> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return [];
        var loaded = await Detailed().Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        var map = loaded.ToDictionary(p => p.Id);
        return ids.Where(map.ContainsKey).Select(id => map[id].ToDto()).ToList();
    }

    internal static string EscapeLike(string s) => s.Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
}
