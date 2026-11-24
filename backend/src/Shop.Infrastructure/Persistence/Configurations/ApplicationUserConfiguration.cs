using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Infrastructure.Identity;

namespace Shop.Infrastructure.Persistence.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> b)
    {
        b.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        b.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        b.Property(x => x.AvatarUrl).HasMaxLength(500);
        b.Property(x => x.PreferredLanguage).HasMaxLength(5).IsRequired();
        b.HasIndex(x => x.IsActive);
    }
}
