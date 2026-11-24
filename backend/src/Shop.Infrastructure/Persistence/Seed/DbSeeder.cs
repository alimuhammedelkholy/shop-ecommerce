using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shop.Domain.Constants;
using Shop.Domain.Entities;
using Shop.Domain.Enums;
using Shop.Infrastructure.Identity;

namespace Shop.Infrastructure.Persistence.Seed;

/// <summary>
/// Idempotent seeder: every section checks whether its data already exists, so it is safe to run on every start.
/// Credentials are never hardcoded: the SuperAdmin and demo customer are only created when
/// Seed:SuperAdmin:* / Seed:DemoCustomer:* are supplied through user-secrets or environment variables.
/// </summary>
public class DbSeeder(
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager,
    IConfiguration configuration,
    ILogger<DbSeeder> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    internal sealed record CatalogSeed(List<CategorySeed> Categories, List<BrandSeed> Brands, List<ProductSeed> Products);
    internal sealed record CategorySeed(string Slug, string Name, string NameAr, string? ParentSlug);
    internal sealed record BrandSeed(string Slug, string Name, string NameAr);
    internal sealed record ProductSeed(string Name, string NameAr, string Category, string Brand, decimal Price, decimal? CompareAt);
    internal sealed record VariantOption(string? Color, string? ColorHex, string? Size, string Code);
    internal sealed record SpecSeed(string Name, string NameAr, string Value, string ValueAr);

    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedRolesAsync();
        await SeedUsersAsync();
        await SeedShippingMethodsAsync(ct);
        await SeedCatalogAsync(ct);
        await SeedMarketingAsync(ct);
        await SeedSettingsAsync(ct);
        logger.LogInformation("Database seeding finished.");
    }

    // ---------- Identity ----------

    private async Task SeedRolesAsync()
    {
        foreach (var role in Roles.All)
        {
            if (await roleManager.RoleExistsAsync(role)) continue;

            var result = await roleManager.CreateAsync(new ApplicationRole(role));
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to create role '{role}': {string.Join("; ", result.Errors.Select(e => e.Description))}");
            }
        }
    }

    private async Task SeedUsersAsync()
    {
        await EnsureUserAsync("Seed:SuperAdmin", "Super", "Admin", Roles.SuperAdmin);
        await EnsureUserAsync("Seed:DemoCustomer", "Demo", "Customer", Roles.Customer);
    }

    private async Task EnsureUserAsync(string configSection, string firstName, string lastName, string role)
    {
        var email = configuration[$"{configSection}:Email"];
        var password = configuration[$"{configSection}:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("{Section} is not configured; skipping creation of this {Role} account.", configSection, role);
            return;
        }

        if (await userManager.FindByEmailAsync(email) is not null) return;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = firstName,
            LastName = lastName,
            IsActive = true
        };

        var created = await userManager.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to seed {role} '{email}': {string.Join("; ", created.Errors.Select(e => e.Description))}");
        }

        var roleResult = await userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to assign role '{role}' to '{email}': {string.Join("; ", roleResult.Errors.Select(e => e.Description))}");
        }

        logger.LogInformation("Seeded {Role} account {Email}.", role, email);
    }

    // ---------- Shipping ----------

    private async Task SeedShippingMethodsAsync(CancellationToken ct)
    {
        if (await db.ShippingMethods.AnyAsync(ct)) return;

        db.ShippingMethods.AddRange(
            new ShippingMethod
            {
                Name = "Standard Shipping", NameAr = "شحن عادي", Description = "Delivered in 3-5 business days",
                Cost = 5.00m, FreeAboveAmount = 100m, EstimatedMinDays = 3, EstimatedMaxDays = 5, SortOrder = 1
            },
            new ShippingMethod
            {
                Name = "Express Shipping", NameAr = "شحن سريع", Description = "Delivered in 1-2 business days",
                Cost = 12.00m, EstimatedMinDays = 1, EstimatedMaxDays = 2, SortOrder = 2
            },
            new ShippingMethod
            {
                Name = "Store Pickup", NameAr = "الاستلام من المتجر", Description = "Collect your order from our store",
                Cost = 0m, EstimatedMinDays = 1, EstimatedMaxDays = 2, SortOrder = 3
            });

        await db.SaveChangesAsync(ct);
    }

    // ---------- Catalog ----------

    private async Task SeedCatalogAsync(CancellationToken ct)
    {
        if (await db.Products.IgnoreQueryFilters().AnyAsync(ct)) return;

        var catalog = LoadCatalog();
        var rng = new Random(20260101); // fixed seed: identical data on every machine
        var now = DateTime.UtcNow;

        var categories = new Dictionary<string, Category>();
        var sort = 0;
        foreach (var c in catalog.Categories)
        {
            categories[c.Slug] = new Category
            {
                Name = c.Name,
                NameAr = c.NameAr,
                Slug = c.Slug,
                SortOrder = ++sort,
                ImageUrl = $"https://picsum.photos/seed/cat-{c.Slug}/800/600"
            };
        }
        foreach (var c in catalog.Categories.Where(c => c.ParentSlug is not null))
        {
            categories[c.Slug].Parent = Lookup(categories, c.ParentSlug!, "parent category");
        }

        var brands = catalog.Brands.ToDictionary(
            b => b.Slug,
            b => new Brand { Name = b.Name, NameAr = b.NameAr, Slug = b.Slug });

        db.Categories.AddRange(categories.Values);
        db.Brands.AddRange(brands.Values);

        var index = 0;
        foreach (var p in catalog.Products)
        {
            index++;
            var slug = Slugify(p.Name);
            var brand = Lookup(brands, p.Brand, "brand");
            var category = Lookup(categories, p.Category, "category");
            var (descEn, descAr) = DescriptionFor(p.Category, p.Name, p.NameAr);

            var product = new Product
            {
                Name = p.Name,
                NameAr = p.NameAr,
                Slug = slug,
                Description = descEn,
                DescriptionAr = descAr,
                BasePrice = p.Price,
                CompareAtPrice = p.CompareAt,
                IsFeatured = index % 5 == 0,
                TotalSold = rng.Next(0, 500),
                ViewCount = rng.Next(50, 5000),
                Category = category,
                Brand = brand,
                CreatedAt = now.AddDays(-rng.Next(0, 120))
            };

            for (var i = 1; i <= 3; i++)
            {
                product.Images.Add(new ProductImage
                {
                    // Placeholder photos; real uploads arrive with the admin product module (Phase 5).
                    Url = $"https://picsum.photos/seed/{slug}-{i}/900/900",
                    AltText = p.Name,
                    SortOrder = i,
                    IsPrimary = i == 1
                });
            }

            var specOrder = 0;
            foreach (var s in SpecsFor(p.Category))
            {
                product.Specifications.Add(new ProductSpecification
                {
                    Name = s.Name, NameAr = s.NameAr, Value = s.Value, ValueAr = s.ValueAr, SortOrder = ++specOrder
                });
            }

            var variantOrder = 0;
            foreach (var v in VariantsFor(p.Category, index))
            {
                // Roughly one variant in ten is seeded with low stock to exercise low-stock alerts.
                var onHand = rng.Next(10) == 0 ? rng.Next(1, 5) : rng.Next(10, 80);
                product.Variants.Add(new ProductVariant
                {
                    Sku = $"{brand.Slug[..3].ToUpperInvariant()}-{index:000}-{v.Code}",
                    Color = v.Color,
                    ColorHex = v.ColorHex,
                    Size = v.Size,
                    SortOrder = ++variantOrder,
                    Inventory = new Inventory { QuantityOnHand = onHand, QuantityReserved = 0, LowStockThreshold = 5 }
                });
            }

            db.Products.Add(product);
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Categories} categories, {Brands} brands, {Products} products.",
            categories.Count, brands.Count, catalog.Products.Count);
    }

    private static CatalogSeed LoadCatalog()
    {
        using var stream = typeof(DbSeeder).Assembly.GetManifestResourceStream("catalog.json")
            ?? throw new InvalidOperationException("Embedded resource 'catalog.json' was not found.");
        return JsonSerializer.Deserialize<CatalogSeed>(stream, JsonOptions)
            ?? throw new InvalidOperationException("catalog.json could not be parsed.");
    }

    private static T Lookup<T>(Dictionary<string, T> map, string key, string what) =>
        map.TryGetValue(key, out var value)
            ? value
            : throw new InvalidOperationException($"catalog.json references unknown {what} '{key}'.");

    /// <summary>Lower-cases and replaces every run of non [a-z0-9] characters with a single hyphen.</summary>
    public static string Slugify(string value) =>
        Regex.Replace(value.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');

    private static List<VariantOption> VariantsFor(string categorySlug, int productIndex)
    {
        switch (categorySlug)
        {
            case "smartphones":
            case "laptops":
            case "headphones":
                return new List<VariantOption>
                {
                    new VariantOption("Black", "#111111", null, "BLK"),
                    new VariantOption("Silver", "#C0C0C0", null, "SLV")
                };

            case "men":
            case "women":
            {
                var (color, hex, code) = ApparelPalette[productIndex % ApparelPalette.Length];
                return new[] { "S", "M", "L", "XL" }.Select(s => new VariantOption(color, hex, s, $"{code}{s}")).ToList();
            }

            case "footwear":
            {
                var (color, hex, code) = ApparelPalette[productIndex % ApparelPalette.Length];
                return new[] { "41", "42", "43", "44" }.Select(s => new VariantOption(color, hex, s, $"{code}{s}")).ToList();
            }

            case "furniture":
                return new List<VariantOption>
                {
                    new VariantOption("Natural Oak", "#C8A27A", null, "NAT"),
                    new VariantOption("White", "#F5F5F5", null, "WHT")
                };

            case "kitchen":
                return new List<VariantOption>
                {
                    new VariantOption("Steel", "#B0B7C3", null, "STL"),
                    new VariantOption("Black", "#111111", null, "BLK")
                };

            default:
                return new List<VariantOption>
                {
                    new VariantOption("Beige", "#E8DCC8", null, "BGE"),
                    new VariantOption("Charcoal", "#36454F", null, "CHR")
                };
        }
    }

    private static readonly (string Color, string Hex, string Code)[] ApparelPalette =
    [
        ("Navy", "#1F2A44", "NVY"),
        ("Olive", "#6B705C", "OLV"),
        ("Charcoal", "#36454F", "CHR"),
        ("Sand", "#D8C3A5", "SND")
    ];

    private static (string En, string Ar) DescriptionFor(string categorySlug, string name, string nameAr) => categorySlug switch
    {
        "smartphones" => (
            $"The {name} pairs smooth everyday performance with a bright display, all-day battery life and a capable camera.",
            $"يجمع {nameAr} بين الأداء السلس يوميًا وشاشة ساطعة وبطارية تدوم طوال اليوم وكاميرا مميزة."),
        "laptops" => (
            $"The {name} is built for productivity on the move, with a responsive keyboard, fast storage and a portable design.",
            $"صُمم {nameAr} للإنتاجية أثناء التنقل بلوحة مفاتيح سريعة الاستجابة وتخزين سريع وتصميم خفيف الحمل."),
        "headphones" => (
            $"Enjoy balanced, immersive sound with the {name}, designed for long listening sessions and all-day comfort.",
            $"استمتع بصوت متوازن وغامر مع {nameAr}، المصمم لجلسات الاستماع الطويلة والراحة طوال اليوم."),
        "men" or "women" => (
            $"The {name} is cut from soft, breathable fabric for a comfortable fit that works from morning to evening.",
            $"صُمم {nameAr} من قماش ناعم وقابل للتنفس لقصة مريحة تناسب الصباح والمساء."),
        "footwear" => (
            $"Step out in comfort with the {name}, featuring a cushioned sole and durable construction.",
            $"انطلق براحة مع {nameAr} بنعل مبطن وتصنيع متين."),
        "furniture" => (
            $"The {name} brings durable craftsmanship and a clean, modern profile to any room.",
            $"يضفي {nameAr} حرفية متينة وتصميمًا عصريًا أنيقًا على أي غرفة."),
        "kitchen" => (
            $"Make everyday cooking easier with the {name}, built to last and simple to clean.",
            $"اجعل الطهي اليومي أسهل مع {nameAr}، المصنوع ليدوم وسهل التنظيف."),
        _ => (
            $"Add warmth and character to your space with the {name}.",
            $"أضف الدفء والشخصية إلى مساحتك مع {nameAr}.")
    };

    private static List<SpecSeed> SpecsFor(string categorySlug) => categorySlug switch
    {
        "smartphones" or "laptops" or "headphones" =>
        new List<SpecSeed>
        {
            new SpecSeed("Warranty", "الضمان", "24 months", "24 شهرًا"),
            new SpecSeed("In the box", "محتويات العبوة", "Device, charging cable, quick start guide", "الجهاز، كابل شحن، دليل البدء السريع")
        },
        "men" or "women" =>
        new List<SpecSeed>
        {
            new SpecSeed("Care", "العناية", "Machine wash cold", "غسل في الغسالة بماء بارد"),
            new SpecSeed("Fit", "القصّة", "True to size", "مقاس مطابق")
        },
        "footwear" =>
        new List<SpecSeed>
        {
            new SpecSeed("Care", "العناية", "Wipe clean with a damp cloth", "تنظيف بقطعة قماش مبللة"),
            new SpecSeed("Fit", "القصّة", "True to size", "مقاس مطابق")
        },
        "furniture" =>
        new List<SpecSeed>
        {
            new SpecSeed("Warranty", "الضمان", "12 months", "12 شهرًا"),
            new SpecSeed("Assembly", "التجميع", "Instructions included", "التعليمات مرفقة")
        },
        "kitchen" =>
        new List<SpecSeed>
        {
            new SpecSeed("Warranty", "الضمان", "12 months", "12 شهرًا"),
            new SpecSeed("Care", "العناية", "Hand wash recommended", "يُفضَّل الغسل اليدوي")
        },
        _ =>
        new List<SpecSeed>
        {
            new SpecSeed("Care", "العناية", "Dust with a soft cloth", "تنظيف بقطعة قماش ناعمة")
        }
    };

    // ---------- Marketing ----------

    private async Task SeedMarketingAsync(CancellationToken ct)
    {
        if (!await db.Coupons.AnyAsync(ct))
        {
            db.Coupons.AddRange(
                new Coupon
                {
                    Code = "WELCOME10", Description = "10% off your order", Type = CouponType.Percentage, Value = 10m,
                    MinOrderAmount = 50m, MaxDiscountAmount = 50m, PerUserLimit = 1
                },
                new Coupon
                {
                    Code = "FREESHIP", Description = "Free shipping on orders over 75", Type = CouponType.FreeShipping,
                    Value = 1m, MinOrderAmount = 75m
                },
                new Coupon
                {
                    Code = "SAVE20", Description = "20 off orders over 150", Type = CouponType.FixedAmount, Value = 20m,
                    MinOrderAmount = 150m, UsageLimit = 1000
                });
        }

        if (!await db.Promotions.AnyAsync(ct))
        {
            db.Promotions.AddRange(
                new Promotion
                {
                    Title = "The Summer Collection", TitleAr = "مجموعة الصيف",
                    Subtitle = "Light, breathable styles for the season", SubtitleAr = "أزياء خفيفة وعملية للموسم",
                    ImageUrl = "https://picsum.photos/seed/hero-summer/1600/600", LinkUrl = "/catalog/fashion",
                    Type = PromotionType.HeroBanner, SortOrder = 1
                },
                new Promotion
                {
                    Title = "Next-Gen Electronics", TitleAr = "إلكترونيات الجيل القادم",
                    Subtitle = "Phones, laptops and audio", SubtitleAr = "هواتف وأجهزة لابتوب وصوتيات",
                    ImageUrl = "https://picsum.photos/seed/hero-electronics/1600/600", LinkUrl = "/catalog/electronics",
                    Type = PromotionType.HeroBanner, SortOrder = 2
                },
                new Promotion
                {
                    Title = "Refresh Your Home", TitleAr = "جدّد منزلك",
                    Subtitle = "Furniture, kitchen and decor", SubtitleAr = "أثاث ومطبخ وديكور",
                    ImageUrl = "https://picsum.photos/seed/hero-home/1600/600", LinkUrl = "/catalog/home-living",
                    Type = PromotionType.HeroBanner, SortOrder = 3
                },
                new Promotion
                {
                    Title = "Free standard shipping over 100", TitleAr = "شحن عادي مجاني للطلبات فوق 100",
                    ImageUrl = "https://picsum.photos/seed/offer-shipping/800/300", Type = PromotionType.Offer, SortOrder = 1
                },
                new Promotion
                {
                    Title = "Use WELCOME10 for 10% off", TitleAr = "استخدم WELCOME10 لخصم 10%",
                    ImageUrl = "https://picsum.photos/seed/offer-welcome/800/300", Type = PromotionType.Offer, SortOrder = 2
                });
        }

        await db.SaveChangesAsync(ct);
    }

    // ---------- Settings ----------

    private async Task SeedSettingsAsync(CancellationToken ct)
    {
        if (await db.SiteSettings.AnyAsync(ct)) return;

        db.SiteSettings.AddRange(
            new SiteSetting { Key = "Store.Name", Value = "Shop", Description = "Public store name" },
            new SiteSetting { Key = "Store.Currency.Default", Value = "USD", Description = "ISO 4217 base currency for all stored prices" },
            new SiteSetting { Key = "Store.Currency.Supported", Value = "USD,EUR,EGP", Description = "Comma-separated display currencies" },
            new SiteSetting { Key = "Store.Language.Default", Value = "en", Description = "Default UI language" },
            new SiteSetting { Key = "Store.Language.Supported", Value = "en,ar", Description = "Comma-separated UI languages" },
            new SiteSetting { Key = "Tax.DefaultRate", Value = "0.10", Description = "Example tax fraction (0.10 = 10%); set to your jurisdiction's rate" });

        await db.SaveChangesAsync(ct);
    }
}
