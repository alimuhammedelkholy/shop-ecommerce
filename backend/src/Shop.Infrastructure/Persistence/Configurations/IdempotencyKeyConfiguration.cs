using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence.Configurations;

public class IdempotencyKeyConfiguration : IEntityTypeConfiguration<IdempotencyKey>
{
    public void Configure(EntityTypeBuilder<IdempotencyKey> b)
    {
        b.ToTable("IdempotencyKeys");
        b.Property(x => x.Key).HasMaxLength(100).IsRequired();
        b.Property(x => x.Scope).HasMaxLength(200).IsRequired();
        b.Property(x => x.RequestHash).HasMaxLength(128).IsRequired();

        b.HasIndex(x => x.Key).IsUnique();
        b.HasIndex(x => x.ExpiresAt);
    }
}
