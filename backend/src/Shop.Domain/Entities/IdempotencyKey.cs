using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class IdempotencyKey : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Scope { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public int? ResponseStatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public DateTime ExpiresAt { get; set; }
}
