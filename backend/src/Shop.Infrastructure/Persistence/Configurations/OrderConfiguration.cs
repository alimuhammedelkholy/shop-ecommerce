using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;
using Shop.Infrastructure.Identity;

namespace Shop.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("Orders", t => t.HasCheckConstraint("CK_Orders_Totals", "[GrandTotal] >= 0 AND [Subtotal] >= 0"));

        b.Property(x => x.OrderNumber).HasMaxLength(32).IsRequired();
        b.Property(x => x.CustomerEmail).HasMaxLength(256).IsRequired();
        b.Property(x => x.CustomerPhone).HasMaxLength(30);
        b.Property(x => x.Status).HasEnumString();
        b.Property(x => x.PaymentStatus).HasEnumString();
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.Subtotal).HasMoney();
        b.Property(x => x.DiscountTotal).HasMoney();
        b.Property(x => x.ShippingTotal).HasMoney();
        b.Property(x => x.TaxTotal).HasMoney();
        b.Property(x => x.GrandTotal).HasMoney();
        b.Property(x => x.CouponCode).HasMaxLength(50);
        b.Property(x => x.ShippingMethodName).HasMaxLength(100).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(1000);
        b.Property(x => x.CancellationReason).HasMaxLength(500);

        b.OwnsOne(x => x.ShippingAddress, a =>
        {
            a.Property(p => p.FullName).HasMaxLength(150).IsRequired();
            a.Property(p => p.Phone).HasMaxLength(30).IsRequired();
            a.Property(p => p.Line1).HasMaxLength(200).IsRequired();
            a.Property(p => p.Line2).HasMaxLength(200);
            a.Property(p => p.City).HasMaxLength(100).IsRequired();
            a.Property(p => p.State).HasMaxLength(100);
            a.Property(p => p.PostalCode).HasMaxLength(20);
            a.Property(p => p.CountryCode).HasMaxLength(2).IsRequired();
        });
        b.Navigation(x => x.ShippingAddress).IsRequired();

        b.HasIndex(x => x.OrderNumber).IsUnique();
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
        b.HasIndex(x => new { x.Status, x.CreatedAt });
        b.HasIndex(x => x.CustomerEmail);

        // Orders are financial records: never cascade-delete them from a user, coupon or shipping method.
        b.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Coupon)
            .WithMany()
            .HasForeignKey(x => x.CouponId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.ShippingMethod)
            .WithMany()
            .HasForeignKey(x => x.ShippingMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
