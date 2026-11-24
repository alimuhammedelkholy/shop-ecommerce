# Architecture

## Layers (backend)

| Project | Responsibility | References |
|---|---|---|
| `Shop.Domain` | Entities, enums, value objects, role names. Pure C#. | none |
| `Shop.Application` | Use-case services (`ICatalogService`, `IOrderService`, `IAuthService`, ...), request/response DTOs, pricing + coupon rules, `AppException`, and the ports Infrastructure implements. | Domain, EF Core (abstractions only) |
| `Shop.Infrastructure` | `ApplicationDbContext` (EF Core/SQL Server + Identity), entity configurations, seeding, `IdentityService`, `JwtTokenService`, `DevPaymentGateway`. | Application, Domain |
| `Shop.Api` | Composition root (`Program.cs`), controllers, JWT bearer, CORS, rate limiting, exception → problem-details mapping, health + OpenAPI. | Application, Infrastructure |

### Ports (defined in Application, implemented in Infrastructure/Api)

- `IApplicationDbContext`: the `DbSet`s the use cases query. Implemented by `ApplicationDbContext`.
- `IIdentityService`: register / validate credentials / display names (ASP.NET Identity).
- `ITokenService`: issues JWT access tokens.
- `IPaymentGateway`: charge a payment (dev stub today).
- `ICurrentUser`: the caller; implemented in Api from `HttpContext`.

Controllers are thin: bind input, call one service method, return the DTO. Business failures are thrown as
`AppException(kind, code, message)`; `AppExceptionHandler` converts them to RFC 7807 responses
(`{ "status": 409, "title": "...", "code": "stock.insufficient" }`). The Angular app maps `code` to a translated message.

## Request flow: placing an order

```
POST /api/orders ─▶ OrdersController ─▶ OrderService.PlaceAsync
   1. validate input, replay-check Idempotency-Key (Payment.IdempotencyKey is unique)
   2. load variants + inventory, take prices from the DB (client prices are ignored)
   3. reserve stock (Inventory.RowVersion = optimistic concurrency)
   4. CouponRules.Check + PricingCalculator.Calculate (pure, unit-tested)
   5. IPaymentGateway.ChargeAsync (skipped for cash on delivery)
   6. one SaveChanges: order + items (snapshots) + payment + stock + coupon usage
```

## Key decisions

- **No MediatR / AutoMapper / FluentValidation.** Services + hand-written mapping keep the dependency list short; add them if the app grows.
- **Application references EF Core abstractions** (not the SQL Server provider) so use cases can express queries without a repository layer.
- **Soft delete** on products, categories, brands; order items snapshot name/SKU/price so history survives catalog changes.
- **Guests can check out.** A guest can read back an order by number + the order e-mail.
- **Config-driven startup work.** `Database:Migrate` / `Database:Seed` decide whether the API touches the schema at startup.
- Schema details: [DATABASE.md](DATABASE.md).

## Frontend

Angular 21, standalone components, signals, zoneless change detection, lazy routes. `ShopApi` is the single seam
between UI and data: `HttpShopApi` (default) talks to this API, `MockShopApi` (`npm run start:mock`) runs on in-browser data.
The production image is nginx serving the build and reverse-proxying `/api` to the API container, so there is one origin and no CORS.
