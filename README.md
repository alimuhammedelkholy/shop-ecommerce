# Shop: full-stack e-commerce (ASP.NET Core 10 + Angular 21)

A bilingual (EN / AR, RTL) online store: an Angular storefront on top of a Clean Architecture ASP.NET Core API and SQL Server.

```
┌────────────┐   /api    ┌─────────────────────── backend ───────────────────────┐   ┌────────────┐
│  Angular   │ ───────▶  │ Shop.Api ─▶ Shop.Application ◀─ Shop.Infrastructure   │──▶│ SQL Server │
│  (nginx)   │ ◀───────  │   HTTP        use cases,         EF Core, Identity,    │   └────────────┘
└────────────┘           │ controllers   DTOs, rules        JWT, payments stub    │
                         │                    ▼                                    │
                         │               Shop.Domain (entities, enums)             │
                         └─────────────────────────────────────────────────────────┘
```

## Repository layout

```
.
├── backend/                     ASP.NET Core solution (Shop.slnx)
│   ├── src/
│   │   ├── Shop.Domain/          Entities, enums, value objects. No dependencies.
│   │   ├── Shop.Application/     Use cases (catalog, orders, auth, reviews, coupons...), DTOs, pricing rules,
│   │   │                         and the interfaces Infrastructure implements. Depends on Domain only.
│   │   ├── Shop.Infrastructure/  EF Core + SQL Server, ASP.NET Identity, JWT, seeding, payment gateway stub.
│   │   └── Shop.Api/             Controllers, auth/CORS/rate-limit pipeline, problem-details errors, composition root.
│   ├── tests/Shop.UnitTests/
│   ├── tools/                    Catalog validation script
│   └── Dockerfile
├── frontend/                    Angular 21 storefront (standalone, signals, zoneless) + nginx Dockerfile
├── docs/                        ARCHITECTURE.md, API.md, DATABASE.md
├── scripts/                     dev.ps1 / dev.sh, add-migration.ps1 / .sh
├── .github/workflows/ci.yml     build + test on every push / PR
├── docker-compose.yml           SQL Server + API + web
└── .env.example
```

Dependency rule: `Api → Application → Domain` and `Infrastructure → Application → Domain`. Application never references
EF providers, Identity, or ASP.NET; Infrastructure plugs in through interfaces (`IApplicationDbContext`, `IIdentityService`,
`ITokenService`, `IPaymentGateway`). Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run it

### Option A: everything in Docker

Requires Docker.

```powershell
Copy-Item .env.example .env        # macOS/Linux: cp .env.example .env
docker compose up --build
```

Open **http://localhost:8080**. The first start creates the database and seeds the catalog (45 products), so give SQL Server ~30 s.

### Option B: local development (hot reload)

Requires the **.NET 10 SDK**, **Node 22**, and Docker (for SQL Server only).

```powershell
.\scripts\dev.ps1                   # macOS/Linux: ./scripts/dev.sh
```

That starts SQL Server in Docker, the API on http://localhost:5080 and the Angular dev server on http://localhost:4200
(it proxies `/api` to the API). Or do it by hand:

```powershell
docker compose up -d sqlserver
cd backend;  dotnet run --project src/Shop.Api          # API
cd frontend; npm install; npm start                     # web
```

### Frontend only (no backend)

```powershell
cd frontend; npm install; npm run start:mock
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `demo@shop.local` | `Demo@12345` |
| SuperAdmin | `admin@shop.local` | `Admin@12345` |

These are public demo values (see `.env.example`). Change them before putting this anywhere reachable. Coupons: `WELCOME10`, `SAVE20`, `FREESHIP`.

## Common commands

```powershell
dotnet test backend/Shop.slnx                         # unit tests
.\scripts\add-migration.ps1 InitialCreate              # create an EF Core migration (see below)
cd frontend; npm run build                             # production build
```

### Database migrations

`Database:Migrate=true` (set in Development and in docker-compose) applies EF migrations on startup. If none exist yet
the schema is created with `EnsureCreated` so a fresh clone runs immediately. For anything long-lived, generate a migration
once and commit it:

```powershell
dotnet tool install --global dotnet-ef --version 10.0.*
.\scripts\add-migration.ps1 InitialCreate
```

Do this **before** the first run against a database you care about: a schema made by `EnsureCreated` cannot be adopted by
migrations later without dropping it. In production set `Database__Migrate=false` and apply migrations from your deployment pipeline.

## What works

- Catalog: categories, brands, faceted search/filter/sort/pagination, suggestions, related products
- Cart and wishlist (client side), coupons, shipping methods, server-side price calculation
- Checkout (guest or signed in): stock reservation with optimistic concurrency, idempotent order placement, order history and tracking
- Auth: register / login with ASP.NET Identity, lockout, JWT bearer tokens, rate-limited auth endpoints
- Reviews (signed-in users; verified-purchase flag), newsletter sign-up
- RFC 7807 error responses with stable error codes the UI translates (EN/AR)

## Known limitations (honest list)

- **Not yet compiled or run end-to-end.** This was authored in an environment with no .NET SDK, npm registry or Docker access.
  Expect to fix a few compile errors on the first `dotnet build` / `npm install && ng build`; CI will show them immediately.
- **Payments are a stub.** `DevPaymentGateway` approves every card/PayPal payment. Implement `IPaymentGateway` (Stripe/PayPal) before taking real money; the card form in the UI is a demo and must be replaced by a hosted payment element.
- Email confirmation, password reset, refresh tokens and an admin back-office are not built (the schema for refresh tokens is ready).
- Product photos are generated artwork in the UI; the API already returns image URLs (placeholder photos from the seed).
- The access token lives in `localStorage`; prefer an httpOnly-cookie flow for production.
- Seed catalog text and prices are placeholder content.

See [docs/API.md](docs/API.md) for the endpoint list.
