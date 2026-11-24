using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;
using Shop.Infrastructure.Identity;

namespace Shop.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.Property(x => x.Type).HasEnumString();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.TitleAr).HasMaxLength(200);
        b.Property(x => x.Message).HasMaxLength(1000).IsRequired();
        b.Property(x => x.MessageAr).HasMaxLength(1000);
        b.Property(x => x.Link).HasMaxLength(500);

        b.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });

        b.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
