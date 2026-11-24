using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Shop.Infrastructure.Persistence.Seed;

namespace Shop.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    /// <summary>
    /// Applies migrations (or creates the schema when no migration has been generated yet) and seeds reference data.
    /// Controlled by <c>Database:Migrate</c> and <c>Database:Seed</c> so production can turn it off and migrate in CI/CD instead.
    /// </summary>
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (config.GetValue("Database:Migrate", false))
        {
            // The SQL Server container needs a few seconds before it accepts logins; EnableRetryOnFailure covers most of it,
            // this loop covers the rest.
            for (var attempt = 1; ; attempt++)
            {
                try
                {
                    if (db.Database.GetMigrations().Any()) await db.Database.MigrateAsync(ct);
                    else
                    {
                        logger.LogWarning("No EF migrations found: creating the schema with EnsureCreated. Run 'dotnet ef migrations add InitialCreate' for real deployments.");
                        await db.Database.EnsureCreatedAsync(ct);
                    }
                    break;
                }
                catch (Exception ex) when (attempt < 10 && !ct.IsCancellationRequested)
                {
                    logger.LogWarning(ex, "Database not ready (attempt {Attempt}/10). Retrying in 5s.", attempt);
                    await Task.Delay(TimeSpan.FromSeconds(5), ct);
                }
            }
        }

        if (config.GetValue("Database:Seed", false))
            await scope.ServiceProvider.GetRequiredService<DbSeeder>().SeedAsync(ct);
    }
}
