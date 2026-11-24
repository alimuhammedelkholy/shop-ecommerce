import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AppliedCoupon, AuthUser, CartLine, Product, ProductVariant } from './models';
import { ShopApi } from './shop-api';
import { readJson, removeKey, writeJson } from './storage';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable({ providedIn: 'root' })
export class Cart {
  private readonly _lines = signal<CartLine[]>(readJson<CartLine[]>('shop.cart', []));
  readonly lines = this._lines.asReadonly();
  readonly coupon = signal<AppliedCoupon | null>(readJson<AppliedCoupon | null>('shop.coupon', null));

  readonly count = computed(() => this._lines().reduce((n, l) => n + l.qty, 0));
  readonly subtotal = computed(() => round2(this._lines().reduce((s, l) => s + l.price * l.qty, 0)));
  readonly discount = computed(() => {
    const c = this.coupon();
    const sub = this.subtotal();
    if (!c) return 0;
    if (c.type === 'Percentage') return round2((sub * c.value) / 100);
    if (c.type === 'FixedAmount') return Math.min(c.value, sub);
    return 0;
  });
  readonly freeShippingLeft = computed(() => Math.max(0, environment.freeShippingThreshold - this.subtotal()));
  readonly freeShippingProgress = computed(() =>
    Math.min(100, Math.round((this.subtotal() / environment.freeShippingThreshold) * 100)),
  );

  constructor() {
    effect(() => writeJson('shop.cart', this._lines()));
    effect(() => {
      const c = this.coupon();
      if (c) writeJson('shop.coupon', c);
      else removeKey('shop.coupon');
    });
  }

  /** Adds (or merges) a line. Returns the quantity that ended up in the cart for that line. */
  add(product: Product, variant: ProductVariant, qty = 1): number {
    const key = `${product.id}-${variant.id}`;
    const maxQty = Math.max(0, Math.min(variant.stock, 10));
    let finalQty = 0;
    this._lines.update((lines) => {
      const existing = lines.find((l) => l.key === key);
      if (existing) {
        finalQty = Math.min(existing.qty + qty, maxQty);
        return lines.map((l) => (l.key === key ? { ...l, qty: finalQty, maxQty } : l));
      }
      finalQty = Math.min(qty, maxQty);
      const line: CartLine = {
        key, productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, nameAr: product.nameAr,
        price: variant.priceOverride ?? product.basePrice, compareAt: product.compareAtPrice, qty: finalQty, maxQty,
        color: variant.color, colorAr: variant.colorAr, colorHex: variant.colorHex, size: variant.size,
        hue: product.hue, glyph: product.glyph,
      };
      return [...lines, line];
    });
    return finalQty;
  }

  setQty(key: string, qty: number): void {
    this._lines.update((lines) =>
      lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(qty, l.maxQty)) } : l)),
    );
  }

  remove(key: string): { line: CartLine; index: number } | null {
    const index = this._lines().findIndex((l) => l.key === key);
    if (index < 0) return null;
    const line = this._lines()[index];
    this._lines.update((lines) => lines.filter((l) => l.key !== key));
    return { line, index };
  }

  restore(line: CartLine, index: number): void {
    this._lines.update((lines) => {
      const next = [...lines];
      next.splice(Math.min(index, next.length), 0, line);
      return next;
    });
  }

  clear(): void {
    this._lines.set([]);
    this.coupon.set(null);
  }
}

@Injectable({ providedIn: 'root' })
export class Wishlist {
  private readonly ids = signal<number[]>(readJson<number[]>('shop.wishlist', []));
  readonly all = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);

  constructor() {
    effect(() => writeJson('shop.wishlist', this.ids()));
  }

  has(id: number): boolean {
    return this.ids().includes(id);
  }

  /** Returns true when the product was added, false when removed. */
  toggle(id: number): boolean {
    const added = !this.ids().includes(id);
    this.ids.update((list) => (added ? [id, ...list] : list.filter((x) => x !== id)));
    return added;
  }

  remove(id: number): void {
    this.ids.update((list) => list.filter((x) => x !== id));
  }
}

@Injectable({ providedIn: 'root' })
export class RecentlyViewed {
  readonly ids = signal<number[]>(readJson<number[]>('shop.recent', []));

  constructor() {
    effect(() => writeJson('shop.recent', this.ids()));
  }

  add(id: number): void {
    this.ids.update((list) => [id, ...list.filter((x) => x !== id)].slice(0, 10));
  }
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(ShopApi);
  readonly user = signal<AuthUser | null>(readJson<AuthUser | null>('shop.user', null));
  readonly token = signal<string | null>(readJson<string | null>('shop.token', null));
  readonly isLoggedIn = computed(() => !!this.user());

  constructor() {
    effect(() => {
      const u = this.user();
      const t = this.token();
      if (u && t) {
        writeJson('shop.user', u);
        writeJson('shop.token', t);
      } else {
        removeKey('shop.user');
        removeKey('shop.token');
      }
    });
  }

  login(email: string, password: string) {
    return this.api.login(email, password);
  }

  register(name: string, email: string, password: string) {
    return this.api.register(name, email, password);
  }

  setSession(result: { token: string; user: AuthUser }): void {
    this.token.set(result.token);
    this.user.set(result.user);
  }

  logout(): void {
    this.user.set(null);
    this.token.set(null);
  }
}
