/**
 * Demo settings: the whole store runs on in-browser data (MockShopApi), no backend needed.
 * Used by `npm run start:mock` / `npm run build:mock`.
 */
export const environment = {
  useMock: true,
  apiUrl: '/api',
  currency: 'USD',
  freeShippingThreshold: 100,
  storeName: 'Shop',
};
