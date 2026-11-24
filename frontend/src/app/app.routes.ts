import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { I18n } from './core/i18n';
import { authRequired, cartNotEmpty } from './core/guards';

const title = (key: string) => () => inject(I18n).t(key);

/** Every page is lazy-loaded, so the first bundle only contains the shell. */
export const routes: Routes = [
  { path: '', title: title('title.home'), loadComponent: () => import('./features/home/home').then((m) => m.Home) },
  { path: 'shop', title: title('title.shop'), loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog) },
  {
    path: 'product/:slug',
    title: title('title.product'),
    loadComponent: () => import('./features/product/product-detail').then((m) => m.ProductDetail),
  },
  { path: 'cart', title: title('title.cart'), loadComponent: () => import('./features/cart/cart-page').then((m) => m.CartPage) },
  {
    path: 'checkout',
    title: title('title.checkout'),
    canActivate: [cartNotEmpty],
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'checkout/success/:orderNo',
    title: title('title.success'),
    loadComponent: () => import('./features/checkout/success').then((m) => m.OrderSuccess),
  },
  { path: 'wishlist', title: title('title.wishlist'), loadComponent: () => import('./features/wishlist/wishlist').then((m) => m.WishlistPage) },
  { path: 'login', title: title('title.login'), loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  {
    path: 'account',
    title: title('title.account'),
    canActivate: [authRequired],
    loadComponent: () => import('./features/account/account').then((m) => m.Account),
  },
  {
    path: 'orders/:number',
    title: title('title.order'),
    canActivate: [authRequired],
    loadComponent: () => import('./features/account/order-tracking').then((m) => m.OrderTracking),
  },
  { path: '**', title: title('title.notFound'), loadComponent: () => import('./features/misc/not-found').then((m) => m.NotFound) },
];
