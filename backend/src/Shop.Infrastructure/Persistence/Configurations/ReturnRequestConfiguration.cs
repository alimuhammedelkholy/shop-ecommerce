using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ReturnRequestConfiguration : IEntityTypeConfiguration<ReturnRequest>
{
    public void Configure(EntityTypeBuilder<ReturnRequest> b)
    {
        b.ToTable("Returns", t => t.HasCheckConstraint("CK_Returns_Quantity", "[Quantity] > 0"));

        b.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        b.Property(x => x.Details).HasMaxLength(2000);
        b.Property(x => x.AdminNote).HasMaxLength(2000);
        b.Property(x => x.Status).HasEnumString();

        b.HasIndex(x => new { x.OrderId, x.Status });
        b.HasIndex(x => x.OrderItemId);

        // Both FKs restrict: a return reaches the order via two paths and SQL Server forbids multiple cascade paths.
        b.HasOne(x => x.Order)
            .WithMany(o => o.ReturnRequests)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.OrderItem)
            .WithMany()
            .HasForeignKey(x => x.OrderItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
