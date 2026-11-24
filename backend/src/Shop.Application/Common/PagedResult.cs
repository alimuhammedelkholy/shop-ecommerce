namespace Shop.Application.Common;

public sealed record Facets(IReadOnlyDictionary<string, int> Categories, IReadOnlyDictionary<string, int> Brands, decimal PriceMin, decimal PriceMax);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize, int Pages, Facets Facets);
