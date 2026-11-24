using Shop.Domain.Common;

namespace Shop.Domain.Entities;

/// <summary>Only a hash of the token is stored; the raw value exists only in the client's HttpOnly cookie.</summary>
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string? CreatedByIp { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByIp { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public string? RevocationReason { get; set; }

    public bool IsRevoked => RevokedAt is not null;
    public bool IsActiveAt(DateTime utcNow) => !IsRevoked && utcNow < ExpiresAt;
}
