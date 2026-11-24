import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of, switchMap, tap, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { BRANDS, CATEGORIES, PRODUCTS, reviewsFor } from './mock-data';
import {
  AppliedCoupon, AuthResult, Brand, Category, Order, OrderLine, Page, PlaceOrderRequest, Product,
  ProductQuery, Review, ShippingMethod, Suggestions,
} from './models';
import { readJson, writeJson } from './storage';

/** Error with a translation key so the UI can show a localized message. */
export class ApiError extends Error {
  constructor(public readonly code: string, public readonly params?: Record<string, string | number>) {
    super(code);
  }
}

export interface NewReview {
  rating: number;
  title: string;
  comment: string;
  author: string;
}

/**
 * The single seam between UI and data. `MockShopApi` runs fully in the browser;
 * `HttpShopApi` talks to the ASP.NET API. Switch with `environment.useMock` (see app.config.ts).
 */
export abstract class ShopApi {
  abstract categories(): Observable<Category[]>;
  abstract brands(): Observable<Brand[]>;
  abstract products(query: ProductQuery): Observable<Page<Product>>;
  abstract product(slug: string): Observable<Product>;
  abstract productsByIds(ids: number[]): Observable<Product[]>;
  abstract related(productId: number): Observable<Product[]>;
  abstract suggest(term: string): Observable<Suggestions>;
  abstract reviews(productId: number): Observable<Review[]>;
  abstract addReview(productId: number, review: NewReview): Observable<Review>;
  abstract validateCoupon(code: string, subtotal: number): Observable<AppliedCoupon>;
  abstract shippingMethods(): Observable<ShippingMethod[]>;
  abstract placeOrder(request: PlaceOrderRequest): Observable<Order>;
  abstract orders(): Observable<Order[]>;
  abstract order(numberOrId: string): Observable<Order>;
  abstract login(email: string, password: string): Observable<AuthResult>;
  abstract register(name: string, email: string, password: string): Observable<AuthResult>;
  abstract subscribeNewsletter(email: string): Observable<void>;
}

// ───────────────────────────── Mock implementation ─────────────────────────────

const SHIPPING: ShippingMethod[] = [
  { id: 1, name: 'Standard Shipping', nameAr: 'شحن عادي', description: 'Delivered in 3-5 business days', descriptionAr: 'التوصيل خلال 3-5 أيام عمل', cost: 5, freeAbove: 100, minDays: 3, maxDays: 5 },
  { id: 2, name: 'Express Shipping', nameAr: 'شحن سريع', description: 'Delivered in 1-2 business days', descriptionAr: 'التوصيل خلال 1-2 يوم عمل', cost: 12, minDays: 1, maxDays: 2 },
  { id: 3, name: 'Store Pickup', nameAr: 'الاستلام من المتجر', description: 'Collect your order from our store', descriptionAr: 'استلم طلبك من المتجر', cost: 0, minDays: 1, maxDays: 2 },
];

const COUPONS: Record<string, AppliedCoupon & { minOrder?: number }> = {
  WELCOME10: { code: 'WELCOME10', type: 'Percentage', value: 10, description: '10% off your order', minOrder: 50 },
  SAVE20: { code: 'SAVE20', type: 'FixedAmount', value: 20, description: '$20 off orders over $150', minOrder: 150 },
  FREESHIP: { code: 'FREESHIP', type: 'FreeShipping', value: 0, description: 'Free shipping' },
};

const ORDERS_KEY = 'shop.orders';

@Injectable()
export class MockShopApi extends ShopApi {
  private lat<T>(value: T, ms = 320): Observable<T> {
    return of(value).pipe(delay(ms));
  }
  private fail<T = never>(code: string, params?: Record<string, string | number>, ms = 320): Observable<T> {
    return timer(ms).pipe(switchMap(() => throwError(() => new ApiError(code, params))));
  }

  categories() { return this.lat(CATEGORIES, 120); }
  brands() { return this.lat(BRANDS, 120); }

  products(q: ProductQuery): Observable<Page<Product>> {
    const term = q.q?.trim().toLowerCase();
    const catId = q.category ? CATEGORIES.find((c) => c.slug === q.category)?.id : undefined;
    const brandIds = (q.brands ?? []).map((s) => BRANDS.find((b) => b.slug === s)?.id).filter((x): x is number => !!x);
    const price = (p: Product) => p.basePrice;

    const base = PRODUCTS.filter((p) => {
      if (term) {
        const hay = `${p.name} ${p.nameAr} ${p.description}`.toLowerCase();
        const brand = BRANDS.find((b) => b.id === p.brandId);
        if (!hay.includes(term) && !`${brand?.name} ${brand?.nameAr}`.toLowerCase().includes(term)) return false;
      }
      if (q.min !== undefined && price(p) < q.min) return false;
      if (q.max !== undefined && price(p) > q.max) return false;
      if (q.rating && p.averageRating < q.rating) return false;
      if (q.sale && !p.compareAtPrice) return false;
      return true;
    });

    const facets = {
      categories: {} as Record<string, number>,
      brands: {} as Record<string, number>,
      priceMin: Math.floor(Math.min(...PRODUCTS.map(price))),
      priceMax: Math.ceil(Math.max(...PRODUCTS.map(price))),
    };
    for (const p of base) {
      if (!brandIds.length || brandIds.includes(p.brandId)) {
        const slug = CATEGORIES.find((c) => c.id === p.categoryId)!.slug;
        facets.categories[slug] = (facets.categories[slug] ?? 0) + 1;
      }
      if (!catId || p.categoryId === catId) {
        const slug = BRANDS.find((b) => b.id === p.brandId)!.slug;
        facets.brands[slug] = (facets.brands[slug] ?? 0) + 1;
      }
    }

    const filtered = base.filter(
      (p) => (!catId || p.categoryId === catId) && (!brandIds.length || brandIds.includes(p.brandId)),
    );

    const sorters: Record<ProductQuery['sort'], (a: Product, b: Product) => number> = {
      featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.totalSold - a.totalSold,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      'price-asc': (a, b) => price(a) - price(b),
      'price-desc': (a, b) => price(b) - price(a),
      rating: (a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount,
      popular: (a, b) => b.totalSold - a.totalSold,
    };
    const sorted = [...filtered].sort(sorters[q.sort]);

    const pages = Math.max(1, Math.ceil(sorted.length / q.pageSize));
    const page = Math.min(Math.max(1, q.page), pages);
    const items = sorted.slice((page - 1) * q.pageSize, page * q.pageSize);
    return this.lat({ items, total: sorted.length, page, pageSize: q.pageSize, pages, facets });
  }

  product(slug: string) {
    const p = PRODUCTS.find((x) => x.slug === slug);
    return p ? this.lat(p) : this.fail<Product>('error.notFound');
  }

  productsByIds(ids: number[]) {
    return this.lat(ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => !!p), 200);
  }

  related(productId: number) {
    const p = PRODUCTS.find((x) => x.id === productId);
    const list = PRODUCTS.filter((x) => x.id !== productId && x.categoryId === p?.categoryId);
    const filler = PRODUCTS.filter((x) => x.id !== productId && x.categoryId !== p?.categoryId && x.isFeatured);
    return this.lat([...list, ...filler].slice(0, 8), 200);
  }

  suggest(term: string): Observable<Suggestions> {
    const t = term.trim().toLowerCase();
    const products = PRODUCTS.filter((p) => `${p.name} ${p.nameAr}`.toLowerCase().includes(t)).slice(0, 5);
    const categories = CATEGORIES.filter((c) => `${c.name} ${c.nameAr}`.toLowerCase().includes(t)).slice(0, 3);
    return this.lat({ products, categories }, 120);
  }

  private extraReviews = readJson<Review[]>('shop.reviews', []);

  reviews(productId: number) {
    const p = PRODUCTS.find((x) => x.id === productId);
    const own = this.extraReviews.filter((r) => r.productId === productId);
    return this.lat([...own, ...(p ? reviewsFor(p) : [])], 200);
  }

  addReview(productId: number, r: NewReview) {
    const review: Review = {
      id: Date.now(), productId, author: r.author, rating: r.rating, title: r.title, comment: r.comment,
      isVerifiedPurchase: false, createdAt: new Date().toISOString(),
    };
    this.extraReviews = [review, ...this.extraReviews];
    writeJson('shop.reviews', this.extraReviews);
    return this.lat(review, 400);
  }

  validateCoupon(code: string, subtotal: number): Observable<AppliedCoupon> {
    const c = COUPONS[code.trim().toUpperCase()];
    if (!c) return this.fail('coupon.invalid');
    if (c.minOrder && subtotal < c.minOrder) return this.fail('coupon.min', { min: c.minOrder });
    const { minOrder: _ignored, ...applied } = c;
    return this.lat(applied, 400);
  }

  shippingMethods() { return this.lat(SHIPPING, 150); }

  private loadOrders(): Order[] {
    const stored = readJson<Order[] | null>(ORDERS_KEY, null);
    if (stored) return stored;
    const seed = this.seedOrders();
    writeJson(ORDERS_KEY, seed);
    return seed;
  }

  private seedOrders(): Order[] {
    const mk = (n: string, daysAgo: number, status: Order['status'], picks: [number, number][]): Order => {
      const lines: OrderLine[] = picks.map(([pid, qty]) => {
        const p = PRODUCTS.find((x) => x.id === pid)!;
        return { productId: p.id, slug: p.slug, name: p.name, nameAr: p.nameAr, variantLabel: '', price: p.basePrice, qty, hue: p.hue, glyph: p.glyph };
      });
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      return {
        id: n, number: n, createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(), status,
        email: 'demo@shop.test',
        address: { fullName: 'Demo Customer', phone: '+20 100 000 0000', line1: '12 Nile Corniche', city: 'Cairo', region: 'Cairo', postalCode: '11511', country: 'Egypt' },
        lines, subtotal, discount: 0, shipping: 0, total: subtotal,
        shippingMethod: 'Standard Shipping', shippingMethodAr: 'شحن عادي', payment: 'CashOnDelivery',
      };
    };
    return [mk('SH-100248', 2, 'Shipped', [[9, 1], [10, 1]]), mk('SH-100173', 21, 'Delivered', [[19, 1]])];
  }

  placeOrder(req: PlaceOrderRequest): Observable<Order> {
    if (!req.lines.length) return this.fail('error.emptyCart');
    const lines: OrderLine[] = [];
    for (const l of req.lines) {
      const p = PRODUCTS.find((x) => x.id === l.productId);
      const v = p?.variants.find((x) => x.id === l.variantId);
      if (!p || !v) return this.fail('error.generic');
      lines.push({
        productId: p.id, slug: p.slug, name: p.name, nameAr: p.nameAr,
        variantLabel: [v.color, v.size].filter(Boolean).join(' / '),
        price: v.priceOverride ?? p.basePrice, qty: l.qty, hue: p.hue, glyph: p.glyph,
      });
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const coupon = req.couponCode ? COUPONS[req.couponCode.toUpperCase()] : undefined;
    const method = SHIPPING.find((m) => m.id === req.shippingMethodId) ?? SHIPPING[0];
    let discount = 0;
    if (coupon?.type === 'Percentage') discount = Math.round(subtotal * coupon.value) / 100;
    if (coupon?.type === 'FixedAmount') discount = Math.min(coupon.value, subtotal);
    const free = (method.freeAbove && subtotal >= method.freeAbove) || coupon?.type === 'FreeShipping';
    const shipping = free ? 0 : method.cost;

    const existing = this.loadOrders();
    const number = `SH-${100248 + existing.length * 7 + Math.floor(Math.random() * 6) + 1}`;
    const order: Order = {
      id: number, number, createdAt: new Date().toISOString(), status: 'Pending', email: req.email,
      address: req.address, lines, subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping),
      shippingMethod: method.name, shippingMethodAr: method.nameAr, payment: req.payment, couponCode: coupon?.code,
    };
    writeJson(ORDERS_KEY, [order, ...existing]);
    return this.lat(order, 900);
  }

  orders() { return this.lat(this.loadOrders(), 250); }

  order(numberOrId: string) {
    const o = this.loadOrders().find((x) => x.number === numberOrId || x.id === numberOrId);
    return o ? this.lat(o, 200) : this.fail<Order>('error.notFound');
  }

  login(email: string, password: string): Observable<AuthResult> {
    if (password.length < 6) return this.fail('auth.invalid', undefined, 500);
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return this.lat({ token: 'mock-token', user: { id: 'u-1', name, email } }, 500);
  }

  register(name: string, email: string, password: string): Observable<AuthResult> {
    if (password.length < 6) return this.fail('auth.weak', undefined, 500);
    return this.lat({ token: 'mock-token', user: { id: 'u-1', name, email } }, 600);
  }

  subscribeNewsletter(_email: string) {
    return this.lat(undefined as void, 500);
  }
}

// ───────────────────────────── HTTP implementation ─────────────────────────────
// Endpoint contract proposed for Phase 3 (adjust to the final controllers).


/** Country names shown in the checkout <-> ISO 3166-1 alpha-2 codes stored by the API. */
const COUNTRY_CODES: Record<string, string> = {
  'Egypt': 'EG', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE', 'Kuwait': 'KW', 'Qatar': 'QA',
  'Jordan': 'JO', 'United Kingdom': 'GB', 'United States': 'US', 'Germany': 'DE',
};
const COUNTRY_NAMES = Object.fromEntries(Object.entries(COUNTRY_CODES).map(([n, c]) => [c, n]));

/** The API serialises UTC timestamps without a "Z"; make the browser read them as UTC. */
const utc = (iso: string): string => (/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z');

/** Maps an HTTP failure (RFC 7807 body with a `code`) to the ApiError the UI already understands. */
function toApiError(err: unknown): Error {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return new ApiError('error.retry');
    const body = err.error as { code?: string; params?: Record<string, string | number> } | null;
    if (body?.code) return new ApiError(body.code, body.params);
    if (err.status === 404) return new ApiError('error.notFound');
    if (err.status === 429) return new ApiError('error.retry');
  }
  return new ApiError('error.generic');
}

@Injectable()
export class HttpShopApi extends ShopApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  /** Guests may read back the order they just placed by presenting its e-mail. */
  private readonly guestEmails = new Map<string, string>(this.loadGuest());

  private call<T>(source: Observable<T>): Observable<T> {
    return source.pipe(catchError((e: unknown) => throwError(() => toApiError(e))));
  }

  private loadGuest(): [string, string][] {
    try { return JSON.parse(sessionStorage.getItem('shop.guestOrders') ?? '[]') as [string, string][]; } catch { return []; }
  }
  private saveGuest(): void {
    try { sessionStorage.setItem('shop.guestOrders', JSON.stringify([...this.guestEmails])); } catch { /* storage unavailable */ }
  }

  private fromApi(o: Order): Order {
    return { ...o, createdAt: utc(o.createdAt), address: { ...o.address, country: COUNTRY_NAMES[o.address.country] ?? o.address.country } };
  }

  categories() { return this.call(this.http.get<Category[]>(`${this.base}/categories`)); }
  brands() { return this.call(this.http.get<Brand[]>(`${this.base}/brands`)); }

  products(q: ProductQuery) {
    let params = new HttpParams().set('sort', q.sort).set('page', q.page).set('pageSize', q.pageSize);
    if (q.q) params = params.set('q', q.q);
    if (q.category) params = params.set('category', q.category);
    if (q.brands?.length) params = params.set('brands', q.brands.join(','));
    if (q.min !== undefined) params = params.set('minPrice', q.min);
    if (q.max !== undefined) params = params.set('maxPrice', q.max);
    if (q.rating) params = params.set('minRating', q.rating);
    if (q.sale) params = params.set('onSale', true);
    return this.call(this.http.get<Page<Product>>(`${this.base}/products`, { params }));
  }
  product(slug: string) { return this.call(this.http.get<Product>(`${this.base}/products/${encodeURIComponent(slug)}`)); }
  productsByIds(ids: number[]) {
    if (!ids.length) return of<Product[]>([]);
    return this.call(this.http.get<Product[]>(`${this.base}/products/by-ids`, { params: { ids: ids.join(',') } }));
  }
  related(id: number) { return this.call(this.http.get<Product[]>(`${this.base}/products/${id}/related`)); }
  suggest(q: string) { return this.call(this.http.get<Suggestions>(`${this.base}/search/suggest`, { params: { q } })); }
  reviews(id: number) {
    return this.call(this.http.get<Review[]>(`${this.base}/products/${id}/reviews`))
      .pipe(map((rs) => rs.map((r) => ({ ...r, createdAt: utc(r.createdAt) }))));
  }
  addReview(id: number, r: NewReview) {
    return this.call(this.http.post<Review>(`${this.base}/products/${id}/reviews`, { rating: r.rating, title: r.title, comment: r.comment }));
  }
  validateCoupon(code: string, subtotal: number) {
    return this.call(this.http.post<AppliedCoupon>(`${this.base}/coupons/validate`, { code, subtotal }));
  }
  shippingMethods() { return this.call(this.http.get<ShippingMethod[]>(`${this.base}/shipping-methods`)); }
  placeOrder(r: PlaceOrderRequest) {
    const body = { ...r, address: { ...r.address, country: COUNTRY_CODES[r.address.country] ?? r.address.country } };
    return this.call(this.http.post<Order>(`${this.base}/orders`, body, { headers: { 'Idempotency-Key': crypto.randomUUID() } })).pipe(
      map((o) => this.fromApi(o)),
      tap((o) => { this.guestEmails.set(o.number, o.email); this.saveGuest(); }),
    );
  }
  orders() { return this.call(this.http.get<Order[]>(`${this.base}/orders`)).pipe(map((os) => os.map((o) => this.fromApi(o)))); }
  order(n: string) {
    const email = this.guestEmails.get(n);
    const params = email ? new HttpParams().set('email', email) : undefined;
    return this.call(this.http.get<Order>(`${this.base}/orders/${encodeURIComponent(n)}`, { params })).pipe(map((o) => this.fromApi(o)));
  }
  login(email: string, password: string) { return this.call(this.http.post<AuthResult>(`${this.base}/auth/login`, { email, password })); }
  register(name: string, email: string, password: string) {
    return this.call(this.http.post<AuthResult>(`${this.base}/auth/register`, { name, email, password }));
  }
  subscribeNewsletter(email: string) {
    return this.call(this.http.post<void>(`${this.base}/newsletter`, { email })).pipe(map(() => undefined));
  }
}
