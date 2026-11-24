namespace Shop.Infrastructure.Identity;

public sealed class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; set; } = "Shop.Api";
    public string Audience { get; set; } = "Shop.Client";
    /// <summary>HMAC signing key, at least 32 characters. Provide via environment/user-secrets, never commit a real one.</summary>
    public string Key { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 120;
}
