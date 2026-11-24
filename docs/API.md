# HTTP API

Base path `/api`. JSON, camelCase, null fields omitted. Errors are `application/problem+json` with a stable `code`.
Interactive schema (Development only): `GET /openapi/v1.json`. Health: `GET /health` (no `/api` prefix).

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/categories` | – | includes `parentSlug` |
| GET | `/brands` | – | |
| GET | `/products` | – | `q, category, brands (csv), minPrice, maxPrice, minRating, onSale, sort, page, pageSize`; returns items + facets |
| GET | `/products/{slug}` | – | |
| GET | `/products/by-ids?ids=1,2,3` | – | order preserved |
| GET | `/products/{id}/related` | – | |
| GET | `/search/suggest?q=` | – | |
| GET | `/products/{id}/reviews` | – | |
| POST | `/products/{id}/reviews` | Bearer | one review per user per product |
| POST | `/coupons/validate` | – | `{ code, subtotal }` |
| GET | `/shipping-methods` | – | |
| POST | `/orders` | optional | header `Idempotency-Key`; attaches to the account when a token is sent |
| GET | `/orders` | Bearer | my orders |
| GET | `/orders/{number}` | owner, or `?email=` | guests pass the order e-mail |
| POST | `/auth/login` | – | rate limited |
| POST | `/auth/register` | – | rate limited; password: 8+ chars, upper, lower, digit, symbol |
| POST | `/newsletter` | – | `{ email }`, idempotent |

`sort` values: `featured`, `newest`, `price-asc`, `price-desc`, `rating`, `popular`.

Error codes the UI translates: `coupon.invalid`, `coupon.min` (`params.min`), `stock.insufficient`, `payment.failed`,
`auth.invalid`, `auth.weak`, `auth.exists`, `auth.locked`, `review.signin`, `review.exists`, `error.notFound`,
`error.emptyCart`, `error.validation`, `error.generic`.
