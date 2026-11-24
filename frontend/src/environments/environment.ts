/**
 * Runtime settings (default: talk to the real ASP.NET API).
 *
 * `apiUrl` is relative on purpose: `ng serve` proxies /api to the backend (proxy.conf.json) and the
 * production nginx image proxies /api to the API container, so no CORS or per-environment URL is needed.
 *
 * For a backend-free demo run `npm run start:mock`, which swaps in environment.mock.ts.
 */
export const environment = {
  useMock: false,
  apiUrl: '/api',
  /** ISO 4217 code. Prices are stored in one base currency (Store.Currency.Default = USD). */
  currency: 'USD',
  /** Mirrors the "Standard Shipping" FreeAboveAmount in DbSeeder. */
  freeShippingThreshold: 100,
  storeName: 'Shop',
};
