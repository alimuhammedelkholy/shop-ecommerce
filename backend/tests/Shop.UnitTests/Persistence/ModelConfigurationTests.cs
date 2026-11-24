using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Shop.Domain.Entities;
using Shop.Infrastructure.Persistence;

namespace Shop.UnitTests.Persistence;

/// <summary>
/// Builds the EF model against the SQL Server provider WITHOUT connecting to a database.
/// Catches invalid mappings, missing keys, and schema-rule regressions at test time.
/// </summary>
public class ModelConfigurationTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=(localdb)\\unused;Database=ModelOnly;Trusted_Connection=True;")
            .Options;
        return new ApplicationDbContext(options);
    }

    private static bool HasUniqueIndex<T>(IModel model, params string[] properties) =>
        model.FindEntityType(typeof(T))!
            .GetIndexes()
            .Any(i => i.IsUnique && i.Properties.Select(p => p.Name).SequenceEqual(properties));

    [Fact]
    public void Model_builds_without_errors()
    {
        using var context = CreateContext();
        Assert.NotEmpty(context.Model.GetEntityTypes());
    }

    [Fact]
    public void Every_domain_entity_is_mapped()
    {
        using var context = CreateContext();
        var domainAssembly = typeof(Product).Assembly;
        var entityTypes = domainAssembly.GetTypes()
            .Where(t => t.Namespace == "Shop.Domain.Entities" && t.IsClass && !t.IsAbstract);

        foreach (var type in entityTypes)
        {
            Assert.True(context.Model.FindEntityType(type) is not null, $"{type.Name} is not mapped in ApplicationDbContext.");
        }
    }

    [Fact]
    public void Every_decimal_property_has_explicit_precision()
    {
        using var context = CreateContext();

        foreach (var entityType in context.Model.GetEntityTypes())
        foreach (var property in entityType.GetProperties()
                     .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            Assert.True(property.GetPrecision() is not null,
                $"{entityType.DisplayName()}.{property.Name} has no explicit decimal precision.");
        }
    }

    [Fact]
    public void Business_keys_are_unique()
    {
        using var context = CreateContext();
        var model = context.Model;

        Assert.True(HasUniqueIndex<Order>(model, nameof(Order.OrderNumber)));
        Assert.True(HasUniqueIndex<Product>(model, nameof(Product.Slug)));
        Assert.True(HasUniqueIndex<ProductVariant>(model, nameof(ProductVariant.Sku)));
        Assert.True(HasUniqueIndex<Coupon>(model, nameof(Coupon.Code)));
        Assert.True(HasUniqueIndex<RefreshToken>(model, nameof(RefreshToken.TokenHash)));
        Assert.True(HasUniqueIndex<IdempotencyKey>(model, nameof(IdempotencyKey.Key)));
    }

    [Fact]
    public void Financial_records_are_never_cascade_deleted_from_orders()
    {
        using var context = CreateContext();

        var paymentToOrder = context.Model.FindEntityType(typeof(Payment))!
            .GetForeignKeys()
            .Single(fk => fk.PrincipalEntityType.ClrType == typeof(Order));

        Assert.Equal(DeleteBehavior.Restrict, paymentToOrder.DeleteBehavior);
    }

    [Fact]
    public void Inventory_has_a_concurrency_token()
    {
        using var context = CreateContext();
        var rowVersion = context.Model.FindEntityType(typeof(Inventory))!.FindProperty(nameof(Inventory.RowVersion));

        Assert.NotNull(rowVersion);
        Assert.True(rowVersion!.IsConcurrencyToken);
    }
}
