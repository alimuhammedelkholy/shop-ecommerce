using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> b)
    {
        b.ToTable("ProductVariants");
        b.Property(x => x.Sku).HasMaxLength(64).IsRequired();
        b.Property(x => x.Color).HasMaxLength(50);
        b.Property(x => x.ColorHex).HasMaxLength(9);
        b.Property(x => x.Size).HasMaxLength(50);
        b.Property(x => x.PriceOverride).HasMoney();

        b.HasIndex(x => x.Sku).IsUnique();
        b.HasIndex(x => new { x.ProductId, x.IsActive });

        b.HasOne(x => x.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Inventory)
            .WithOne(i => i.ProductVariant)
            .HasForeignKey<Inventory>(i => i.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
