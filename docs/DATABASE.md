# Database design

SQL Server via EF Core 10. Entities live in `backend/src/Shop.Domain`, mappings in `backend/src/Shop.Infrastructure/Persistence/Configurations`.

## Schema overview

```
Users ──< Addresses          Users ──1 Cart ──< CartItems >── ProductVariants
Users ──< RefreshTokens      Users ──1 Wishlist ──< WishlistItems >── Products
Users ──< Notifications      Users ──< Reviews >── Products
Users ──< Orders ──< OrderItems >── ProductVariants
          Orders ──< Payments ──< Transactions
                     Payments ──< Refunds >── Returns (optional)
          Orders ──< Shipments
          Orders ──< Returns >── OrderItems
Brands ──< Products >── Categories (self-referencing ParentId)
Products ──< ProductImages / ProductSpecifications / ProductVariants ──1 Inventory
Standalone: Coupons, Promotions, ShippingMethods, NewsletterSubscribers, SiteSettings, IdempotencyKeys, AuditLogs
```

### Decisions made (and why)

- **Ids:** `int` for business tables, `Guid` for Identity users and roles.
- **Users are not in the Domain project.** `ApplicationUser` lives in Infrastructure so Domain stays free of Identity. Entities hold a plain `UserId` and EF configures the FK.
- **Soft delete** (global query filter) on Products, Categories, Brands. Slug uniqueness is a filtered index (`IsDeleted = 0`), so a deleted slug can be reused. `OrderItem` snapshots name, SKU and price and keeps a non-FK `ProductId`, so order history and sales reports survive soft-deletion. Avoid `Include(Variant).ThenInclude(Product)` when loading orders.
- **Money** is `decimal(18,2)`; coupon and promotion percentages use their own precision. Enforced by a unit test.
- **Enums are stored as strings** (`nvarchar(32)`) for readable data.
- **Oversell protection:** `Inventory.RowVersion` concurrency token plus a check constraint (`0 <= reserved <= onHand`).
- **Financial records are never cascade-deleted:** orders, payments, transactions, refunds and returns use `Restrict`. Carts, wishlists, addresses, notifications, tokens and reviews cascade from the user.
- **`Refund` links to `Payment` (and optionally a return)** rather than to a transaction; the refund's ledger entry is a `PaymentTransaction` of type `Refund`. This is a small change from the Phase 1 ERD.
- **Bilingual content:** names and descriptions have `*Ar` columns. Variant colors store a hex swatch only; the UI translates color names.
- **Refresh tokens and idempotency keys** are in the schema now so the auth work and checkout need no schema rework. Only token hashes are stored.
- **Seeder never hardcodes credentials.** Accounts are created only when `Seed:*` config is supplied. Passwords must satisfy the Identity policy (8+ chars, upper, lower, digit, symbol).
- **Currency:** prices are stored in one base currency (`Store.Currency.Default`, seeded as USD); display conversion is a future work.
- **Seed catalog:** 12 categories (3 roots, 9 leaves), 10 fictional brands, 45 products (5 per leaf; 16 on sale), 120 variants with inventory, 3 images each. Copy, specs and photos (picsum.jpg placeholders) are **placeholder content**. Testimonials will come from approved reviews in a future work.
- **Floating package versions** (`10.0.*`) because exact patch versions could not be checked offline. Pin them after your first restore.
