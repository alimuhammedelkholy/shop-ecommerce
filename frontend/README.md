# Shop client (Angular)

Storefront for the `Shop.Api` backend. Built with current Angular patterns: standalone components, signals
(`signal`, `computed`, `effect`, `input()`, `model()`), zoneless change detection, built-in control flow
(`@if` / `@for` / `@switch` / `@let`), `@defer (on viewport)`, lazy routes, route params and query params bound
straight to component inputs, View Transitions between pages, functional guards and interceptors.

> Authored without network access, so `npm install` / `ng build` were not run in the authoring environment. Syntax, templates and
> translations were checked by script and the styles rendered in a browser. CI builds it on every push.

## Run

```bash
cd frontend
npm install
npm start            # http://localhost:4200, proxies /api to http://localhost:5080 (the API)
npm run start:mock   # no backend: runs on in-browser demo data
```

Requires Node 20.19+ / 22. `package.json` targets Angular `^21`.

## Real API vs demo data

`src/environments/environment.ts` has `useMock: false`, so `HttpShopApi` (`core/shop-api.ts`) calls the API
(see [../docs/API.md](../docs/API.md)). `npm run start:mock` / `build:mock` swap in `environment.mock.ts` (`useMock: true`):
28 products, coupons `WELCOME10`, `SAVE20`, `FREESHIP`, any e-mail + 6-char password.
Server error `code`s are mapped to `ApiError` and translated (EN/AR) in `core/translations.ts`.

## Features

- Home: animated hero, trust strip, categories, flash deals with live countdown, tabbed product carousel, promos, reviews
- Catalog: live search suggestions (keyboard navigable), URL-driven filters (category, brand, price, rating, on-sale), sorting, grid/list, pagination, skeletons
- Product page: gallery, color/size/storage variants with stock states, reviews + rating distribution, write a review, related + recently viewed, sticky mobile buy bar
- Cart (drawer + page): quantity stepper, undo remove, free-shipping progress, coupons
- Checkout: 3 steps with validation (Luhn card check, expiry, phone), delivery methods, COD / card / PayPal, order success
- Account: orders list, order tracking timeline, preferences; wishlist; sign in / register
- Responsive: phone bottom nav, bottom-sheet filters, fluid grids. Arabic (RTL) + English, light + dark theme, persisted
- Accessibility: skip link, focus rings, ARIA for tabs/dialogs/radios, reduced-motion support

## Structure

```
src/app
  core/      models, ShopApi (mock + http), stores (cart, wishlist, auth), i18n, theme, guards, interceptor
  shared/    icon, art, product-card, grid, carousel, stepper, pagination, toasts ...
  layout/    header, search, cart drawer, mobile menu, bottom nav, footer
  features/  home, catalog, product, cart, checkout, account, auth, wishlist, misc
src/styles   tokens (design tokens + dark theme), base, components, layout, pages
```

## Before production

- Product images are generated artwork (`shared/art.ts`); swap for `<img>` / `NgOptimizedImage` once the API serves images.
- Card fields are a demo. Use a hosted payment form (e.g. Stripe Elements) so card data never touches your app.
- Prefer httpOnly-cookie auth over a token in `localStorage` for the real login.
- Add unit and e2e tests (none included yet).
