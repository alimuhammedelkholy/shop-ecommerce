using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ProductSpecificationConfiguration : IEntityTypeConfiguration<ProductSpecification>
{
    public void Configure(EntityTypeBuilder<ProductSpecification> b)
    {
        b.ToTable("ProductSpecifications");
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.NameAr).HasMaxLength(150).IsRequired();
        b.Property(x => x.Value).HasMaxLength(500).IsRequired();
        b.Property(x => x.ValueAr).HasMaxLength(500).IsRequired();

        b.HasIndex(x => new { x.ProductId, x.SortOrder });

        b.HasOne(x => x.Product)
            .WithMany(p => p.Specifications)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
