using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("Products", t => t.HasCheckConstraint("CK_Products_BasePrice", "[BasePrice] >= 0"));

        b.Property(x => x.Name).HasMaxLength(250).IsRequired();
        b.Property(x => x.NameAr).HasMaxLength(250).IsRequired();
        b.Property(x => x.Slug).HasMaxLength(280).IsRequired();
        b.Property(x => x.BasePrice).HasMoney();
        b.Property(x => x.CompareAtPrice).HasMoney();
        b.Property(x => x.AverageRating).HasPrecision(3, 2);

        b.HasIndex(x => x.Slug).IsUnique().HasFilter("[IsDeleted] = 0");
        b.HasIndex(x => new { x.CategoryId, x.IsActive, x.BasePrice });
        b.HasIndex(x => new { x.BrandId, x.IsActive });
        b.HasIndex(x => new { x.IsFeatured, x.IsActive });
        b.HasIndex(x => x.TotalSold);

        b.HasOne(x => x.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Brand)
            .WithMany(br => br.Products)
            .HasForeignKey(x => x.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasQueryFilter(x => !x.IsDeleted);
    }
}
