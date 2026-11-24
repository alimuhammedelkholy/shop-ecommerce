using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ShippingMethodConfiguration : IEntityTypeConfiguration<ShippingMethod>
{
    public void Configure(EntityTypeBuilder<ShippingMethod> b)
    {
        b.ToTable("ShippingMethods");
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.NameAr).HasMaxLength(100).IsRequired();
        b.Property(x => x.Description).HasMaxLength(300);
        b.Property(x => x.Cost).HasMoney();
        b.Property(x => x.FreeAboveAmount).HasMoney();

        b.HasIndex(x => new { x.IsActive, x.SortOrder });
    }
}
