using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> b)
    {
        b.ToTable("Refunds", t => t.HasCheckConstraint("CK_Refunds_Amount", "[Amount] > 0"));

        b.Property(x => x.Amount).HasMoney();
        b.Property(x => x.Reason).HasMaxLength(500);
        b.Property(x => x.Status).HasEnumString();
        b.Property(x => x.ProviderRefundId).HasMaxLength(200);

        b.HasIndex(x => x.PaymentId);
        b.HasIndex(x => x.ReturnRequestId);

        b.HasOne(x => x.Payment)
            .WithMany(p => p.Refunds)
            .HasForeignKey(x => x.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.ReturnRequest)
            .WithMany(r => r.Refunds)
            .HasForeignKey(x => x.ReturnRequestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
