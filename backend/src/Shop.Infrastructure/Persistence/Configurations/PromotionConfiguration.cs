using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> b)
    {
        b.ToTable("Promotions");
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.TitleAr).HasMaxLength(200).IsRequired();
        b.Property(x => x.Subtitle).HasMaxLength(300);
        b.Property(x => x.SubtitleAr).HasMaxLength(300);
        b.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();
        b.Property(x => x.LinkUrl).HasMaxLength(500);
        b.Property(x => x.Type).HasEnumString();
        b.Property(x => x.DiscountPercent).HasPrecision(5, 2);

        b.HasIndex(x => new { x.Type, x.IsActive, x.SortOrder });
    }
}
