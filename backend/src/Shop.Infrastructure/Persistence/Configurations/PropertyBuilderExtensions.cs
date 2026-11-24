using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Shop.Infrastructure.Persistence.Configurations;

internal static class PropertyBuilderExtensions
{
    /// <summary>decimal(18,2) for all currency amounts.</summary>
    public static PropertyBuilder<T> HasMoney<T>(this PropertyBuilder<T> builder) => builder.HasPrecision(18, 2);

    /// <summary>Stores an enum as a readable string (nvarchar(32)) so the database stays self-describing.</summary>
    public static PropertyBuilder<TEnum> HasEnumString<TEnum>(this PropertyBuilder<TEnum> builder)
        where TEnum : struct, Enum
        => builder.HasConversion<string>().HasMaxLength(32);
}
