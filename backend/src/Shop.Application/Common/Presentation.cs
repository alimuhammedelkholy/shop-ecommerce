namespace Shop.Application.Common;

/// <summary>Deterministic art hints (glyph + hue) so every client renders the same product artwork.</summary>
public static class Presentation
{
    private static readonly Dictionary<string, string> Glyphs = new(StringComparer.OrdinalIgnoreCase)
    {
        ["smartphones"] = "phone", ["laptops"] = "laptop", ["headphones"] = "headphones", ["electronics"] = "laptop",
        ["men"] = "shirt", ["women"] = "shirt", ["fashion"] = "shirt", ["footwear"] = "shoe",
        ["furniture"] = "sofa", ["kitchen"] = "sofa", ["decor"] = "sofa", ["home-living"] = "sofa",
    };

    public static string GlyphFor(string? categorySlug) =>
        categorySlug is not null && Glyphs.TryGetValue(categorySlug, out var g) ? g : "dumbbell";

    public static int HueFor(string? seed)
    {
        if (string.IsNullOrEmpty(seed)) return 220;
        var h = 0;
        foreach (var ch in seed) h = (h * 31 + ch) % 360;
        return h;
    }

    public static string Money(decimal v) => v.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture);
}
