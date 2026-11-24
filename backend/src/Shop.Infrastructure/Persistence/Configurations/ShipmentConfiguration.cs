using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> b)
    {
        b.ToTable("Shipments");
        b.Property(x => x.Carrier).HasMaxLength(100).IsRequired();
        b.Property(x => x.TrackingNumber).HasMaxLength(100);
        b.Property(x => x.Status).HasEnumString();

        b.HasIndex(x => x.OrderId);
        b.HasIndex(x => x.TrackingNumber);

        b.HasOne(x => x.Order)
            .WithMany(o => o.Shipments)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
