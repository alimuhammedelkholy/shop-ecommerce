using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> b)
    {
        b.ToTable("Transactions");
        b.Property(x => x.Type).HasEnumString();
        b.Property(x => x.Status).HasEnumString();
        b.Property(x => x.Amount).HasMoney();
        b.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        b.Property(x => x.ProviderTransactionId).HasMaxLength(200);
        b.Property(x => x.ErrorMessage).HasMaxLength(1000);

        b.HasIndex(x => new { x.PaymentId, x.CreatedAt });
        b.HasIndex(x => x.ProviderTransactionId);

        b.HasOne(x => x.Payment)
            .WithMany(p => p.Transactions)
            .HasForeignKey(x => x.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
