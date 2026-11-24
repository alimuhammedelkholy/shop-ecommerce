using Shop.Domain.Constants;
using Shop.Domain.Entities;
using Shop.Infrastructure.Persistence.Seed;

namespace Shop.UnitTests.Persistence;

public class DomainRulesTests
{
    [Fact]
    public void Roles_contains_the_four_required_roles()
    {
        Assert.Equal(new[] { "SuperAdmin", "Admin", "Manager", "Customer" }, Roles.All);
    }

    [Theory]
    [InlineData("Nova X1 Smartphone 128GB", "nova-x1-smartphone-128gb")]
    [InlineData("Haven Electric Kettle 1.7L", "haven-electric-kettle-1-7l")]
    [InlineData("  Kora Oxford Button-Down Shirt ", "kora-oxford-button-down-shirt")]
    public void Slugify_produces_url_safe_slugs(string input, string expected)
    {
        Assert.Equal(expected, DbSeeder.Slugify(input));
    }

    [Fact]
    public void Inventory_available_quantity_excludes_reserved_stock()
    {
        var inventory = new Inventory { QuantityOnHand = 10, QuantityReserved = 4, LowStockThreshold = 6 };

        Assert.Equal(6, inventory.QuantityAvailable);
        Assert.True(inventory.IsLowStock);
    }

    [Fact]
    public void Revoked_or_expired_refresh_tokens_are_inactive()
    {
        var now = DateTime.UtcNow;

        Assert.True(new RefreshToken { ExpiresAt = now.AddDays(1) }.IsActiveAt(now));
        Assert.False(new RefreshToken { ExpiresAt = now.AddDays(1), RevokedAt = now }.IsActiveAt(now));
        Assert.False(new RefreshToken { ExpiresAt = now.AddSeconds(-1) }.IsActiveAt(now));
    }
}
