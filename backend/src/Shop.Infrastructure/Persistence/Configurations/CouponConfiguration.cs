using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> b)
    {
        b.ToTable("Coupons", t => t.HasCheckConstraint("CK_Coupons_Value", "[Value] > 0"));

        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.Description).HasMaxLength(250);
        b.Property(x => x.Type).HasEnumString();
        b.Property(x => x.Value).HasMoney();
        b.Property(x => x.MinOrderAmount).HasMoney();
        b.Property(x => x.MaxDiscountAmount).HasMoney();

        b.HasIndex(x => x.Code).IsUnique();
    }
}
