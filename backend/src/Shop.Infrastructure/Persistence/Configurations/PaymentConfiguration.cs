using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("Payments");
        b.Property(x => x.Provider).HasEnumString();
        b.Property(x => x.Status).HasEnumString();
        b.Property(x => x.Amount).HasMoney();
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.ProviderPaymentId).HasMaxLength(200);
        b.Property(x => x.IdempotencyKey).HasMaxLength(100);
        b.Property(x => x.FailureReason).HasMaxLength(1000);

        b.HasIndex(x => x.OrderId);
        b.HasIndex(x => new { x.Provider, x.ProviderPaymentId }).IsUnique().HasFilter("[ProviderPaymentId] IS NOT NULL");
        b.HasIndex(x => x.IdempotencyKey).IsUnique().HasFilter("[IdempotencyKey] IS NOT NULL");

        b.HasOne(x => x.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
