# Backend

ASP.NET Core 10 solution in Clean Architecture (`Domain`, `Application`, `Infrastructure`, `Api`). See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

```powershell
docker compose -f ..\docker-compose.yml up -d sqlserver   # database
dotnet build Shop.slnx
dotnet test  Shop.slnx
dotnet run --project src/Shop.Api                         # http://localhost:5080/health
```

Development settings (connection string, demo accounts, dev JWT key) are in `src/Shop.Api/appsettings.Development.json`.
Outside Development, provide `ConnectionStrings__DefaultConnection`, `Jwt__Key` (32+ chars) and optionally `Database__Migrate`,
`Database__Seed`, `Seed__*`, `Cors__Origins__0` as environment variables or user-secrets.
