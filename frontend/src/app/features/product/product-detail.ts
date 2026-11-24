import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { I18n, TPipe } from '../../core/i18n';
import { queryFrom } from '../../core/query';
import { ApiError, ShopApi } from '../../core/shop-api';
import { Auth, Cart, RecentlyViewed, Wishlist } from '../../core/stores';
import { Toasts } from '../../core/toast';
import { Ui } from '../../core/ui';
import { Art } from '../../shared/art';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { Carousel } from '../../shared/carousel';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { ProductCard } from '../../shared/product-card';
import { Rating } from '../../shared/rating';
import { Stepper } from '../../shared/stepper';

type Tab = 'desc' | 'specs' | 'reviews';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ReactiveFormsModule, Art, Breadcrumbs, Carousel, EmptyState, Icon, ProductCard, Rating, Stepper, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      @if (product(); as p) {
        <app-breadcrumbs [items]="crumbs()" />

        <div class="pdp">
          <!-- Gallery -->
          <section class="gallery" [attr.aria-label]="'pdp.gallery' | t">
            <div class="gallery-main">
              <app-art [hue]="p.hue" [glyph]="p.glyph" [view]="activeImg()" [tint]="tint()" />
              @if (discount() > 0) { <span class="badge badge-sale gallery-badge">-{{ discount() }}%</span> }
              <button type="button" class="gallery-nav gallery-prev" (click)="step(-1)" [attr.aria-label]="'a11y.prev' | t"><app-icon class="flip-rtl" name="chevron-left" [size]="20" /></button>
              <button type="button" class="gallery-nav gallery-next" (click)="step(1)" [attr.aria-label]="'a11y.next' | t"><app-icon class="flip-rtl" name="chevron-right" [size]="20" /></button>
            </div>
            <div class="gallery-thumbs">
              @for (v of views; track v) {
                <button type="button" class="thumb" [class.active]="activeImg() === v" (click)="activeImg.set(v)" [attr.aria-label]="('pdp.image' | t) + ' ' + (v + 1)" [attr.aria-current]="activeImg() === v">
                  <app-art [hue]="p.hue" [glyph]="p.glyph" [view]="v" [tint]="tint()" />
                </button>
              }
            </div>
          </section>

          <!-- Buy box -->
          <section class="buybox">
            <a class="pdp-brand" routerLink="/shop" [queryParams]="{ brand: p.brandSlug }">{{ i18n.pick(p.brandName, p.brandNameAr) }}</a>
            <h1 class="pdp-title">{{ i18n.pick(p.name, p.nameAr) }}</h1>

            <button type="button" class="pdp-rating" (click)="openReviews()">
              <app-rating [value]="p.averageRating" [size]="17" />
              <b>{{ p.averageRating.toFixed(1) }}</b>
              <span class="muted">({{ i18n.num(p.reviewCount) }} {{ 'pdp.reviews' | t }})</span>
            </button>

            <div class="pdp-price">
              <span class="price-now lg">{{ i18n.money(price()) }}</span>
              @if (compareAt(); as c) {
                <s class="price-old">{{ i18n.money(c) }}</s>
                <span class="badge badge-sale">{{ 'pdp.save' | t: { amount: i18n.money(c - price()) } }}</span>
              }
            </div>

            <ul class="highlights">
              @for (h of highlights(); track h) { <li><app-icon name="check" [size]="16" [stroke]="2.5" /> {{ h }}</li> }
            </ul>

            @if (colors().length) {
              <div class="opt">
                <div class="opt-label"><b>{{ 'pdp.color' | t }}:</b> <span>{{ selectedColorName() }}</span></div>
                <div class="swatches" role="radiogroup" [attr.aria-label]="'pdp.color' | t">
                  @for (c of colors(); track c.name) {
                    <button type="button" role="radio" class="swatch" [class.active]="selColor() === c.name" [class.out]="!c.available"
                      [attr.aria-checked]="selColor() === c.name" [attr.aria-label]="c.label" [title]="c.label" [disabled]="!c.available" (click)="pickColor(c.name)">
                      <span [style.background]="c.hex"></span>
                    </button>
                  }
                </div>
              </div>
            }

            @if (sizes().length) {
              <div class="opt">
                <div class="opt-label"><b>{{ sizeLabel() }}:</b> <span>{{ selSize() }}</span></div>
                <div class="pills" role="radiogroup" [attr.aria-label]="sizeLabel()">
                  @for (s of sizes(); track s.name) {
                    <button type="button" role="radio" class="pill" [class.active]="selSize() === s.name" [class.out]="!s.available"
                      [attr.aria-checked]="selSize() === s.name" [disabled]="!s.available" (click)="selSize.set(s.name)">{{ s.name }}</button>
                  }
                </div>
              </div>
            }

            <div class="stock" [attr.data-state]="stockState()">
              <span class="stock-dot"></span>
              @switch (stockState()) {
                @case ('out') { {{ 'pdp.out' | t }} }
                @case ('low') { {{ 'pdp.low' | t: { n: i18n.num(stock()) } }} }
                @default { {{ 'pdp.in' | t }} }
              }
            </div>

            <div class="buy-row">
              <app-stepper [(value)]="qty" [max]="maxQty()" />
              <button type="button" class="btn btn-primary btn-lg grow" [disabled]="!variant() || stock() === 0" (click)="add(false)">
                <app-icon name="bag" [size]="19" /> {{ 'cta.addToCart' | t }}
              </button>
              <button type="button" class="btn btn-secondary btn-lg btn-icon-only" (click)="toggleWish()" [attr.aria-pressed]="wished()" [attr.aria-label]="(wished() ? 'wish.remove' : 'wish.add') | t" [class.is-wished]="wished()">
                <app-icon name="heart" [size]="20" [filled]="wished()" />
              </button>
            </div>
            <button type="button" class="btn btn-accent btn-lg btn-block" [disabled]="!variant() || stock() === 0" (click)="add(true)">
              <app-icon name="zap" [size]="19" [filled]="true" /> {{ 'cta.buyNow' | t }}
            </button>

            <ul class="perks">
              <li><app-icon name="truck" [size]="20" /><div><b>{{ 'pdp.delivery' | t }}</b><span>{{ 'pdp.deliveryText' | t: { from: eta(3), to: eta(5) } }}</span></div></li>
              <li><app-icon name="undo" [size]="20" /><div><b>{{ 'trust.returns' | t }}</b><span>{{ 'trust.returnsText' | t }}</span></div></li>
              <li><app-icon name="shield" [size]="20" /><div><b>{{ 'trust.secure' | t }}</b><span>{{ 'trust.secureText' | t }}</span></div></li>
            </ul>
            <p class="sku muted small">SKU: {{ variant()?.sku }}</p>
          </section>
        </div>

        <!-- Tabs -->
        <section class="pdp-tabs" id="details">
          <div class="tabs tabs-line" role="tablist">
            @for (t of tabList; track t.key) {
              <button type="button" class="tab" role="tab" [id]="'tab-' + t.key" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" [attr.aria-controls]="'panel-' + t.key" (click)="tab.set(t.key)">
                {{ t.label | t }}@if (t.key === 'reviews') { <span class="tab-count">{{ i18n.num(p.reviewCount) }}</span> }
              </button>
            }
          </div>

          <div class="tab-panel" role="tabpanel" [id]="'panel-' + tab()" [attr.aria-labelledby]="'tab-' + tab()">
            @switch (tab()) {
              @case ('desc') {
                <p class="prose">{{ i18n.pick(p.description, p.descriptionAr) }}</p>
              }
              @case ('specs') {
                <dl class="specs">
                  @for (s of p.specifications; track s.name) {
                    <div class="spec-row"><dt>{{ i18n.pick(s.name, s.nameAr) }}</dt><dd>{{ s.value }}</dd></div>
                  }
                </dl>
              }
              @case ('reviews') {
                <div class="reviews">
                  <div class="rev-summary">
                    <div class="rev-score"><b>{{ p.averageRating.toFixed(1) }}</b><app-rating [value]="p.averageRating" [size]="18" /><span class="muted">{{ i18n.num(p.reviewCount) }} {{ 'pdp.reviews' | t }}</span></div>
                    <div class="rev-bars">
                      @for (row of distribution(); track row.star) {
                        <div class="rev-bar"><span>{{ row.star }}★</span><div class="progress thin"><span [style.width.%]="row.pct"></span></div><span class="muted">{{ i18n.num(row.count) }}</span></div>
                      }
                    </div>
                  </div>

                  <form class="rev-form" [formGroup]="reviewForm" (ngSubmit)="submitReview()" novalidate>
                    <h3>{{ 'review.write' | t }}</h3>
                    <div class="rate-input" role="radiogroup" [attr.aria-label]="'review.rating' | t">
                      @for (n of [1, 2, 3, 4, 5]; track n) {
                        <button type="button" role="radio" [attr.aria-checked]="reviewForm.controls.rating.value === n" [attr.aria-label]="n + ' / 5'"
                          [class.on]="n <= (hoverRating() || reviewForm.controls.rating.value)" (mouseenter)="hoverRating.set(n)" (mouseleave)="hoverRating.set(0)" (click)="setRating(n)">
                          <app-icon name="star" [size]="26" [filled]="true" />
                        </button>
                      }
                    </div>
                    <div class="field">
                      <input class="input" formControlName="title" [placeholder]="'review.title' | t" [attr.aria-label]="'review.title' | t" maxlength="80" />
                    </div>
                    <div class="field">
                      <textarea class="input" rows="3" formControlName="comment" [placeholder]="'review.comment' | t" [attr.aria-label]="'review.comment' | t" maxlength="800"></textarea>
                      @if (reviewForm.controls.comment.touched && reviewForm.controls.comment.invalid) { <small class="field-error">{{ 'review.minChars' | t }}</small> }
                    </div>
                    @if (ratingMissing()) { <small class="field-error">{{ 'review.pickRating' | t }}</small> }
                    <button type="submit" class="btn btn-primary" [disabled]="submitting()">{{ 'review.submit' | t }}</button>
                  </form>

                  <ul class="rev-list">
                    @for (r of reviews().data ?? []; track r.id) {
                      <li class="rev">
                        <div class="rev-head">
                          <span class="avatar">{{ r.author.charAt(0) }}</span>
                          <div><b>{{ r.author }}</b> @if (r.isVerifiedPurchase) { <span class="badge badge-ok"><app-icon name="check" [size]="11" [stroke]="3" /> {{ 'review.verified' | t }}</span> }
                            <small class="muted">{{ i18n.date(r.createdAt) }}</small></div>
                          <app-rating class="rev-stars" [value]="r.rating" [size]="15" />
                        </div>
                        <h4>{{ r.title }}</h4>
                        <p>{{ r.comment }}</p>
                      </li>
                    }
                  </ul>
                </div>
              }
            }
          </div>
        </section>

        <!-- Related / recently viewed -->
        @if (related().data?.length) {
          <section class="section tight">
            <div class="section-head"><h2>{{ 'pdp.related' | t }}</h2></div>
            <app-carousel>
              @for (r of related().data ?? []; track r.id) { <div class="slide"><app-product-card [product]="r" /></div> }
            </app-carousel>
          </section>
        }
        @if (recent().data?.length) {
          <section class="section tight">
            <div class="section-head"><h2>{{ 'pdp.recent' | t }}</h2></div>
            <app-carousel>
              @for (r of recent().data ?? []; track r.id) { <div class="slide"><app-product-card [product]="r" /></div> }
            </app-carousel>
          </section>
        }

        <!-- Sticky mobile buy bar -->
        <div class="buy-bar">
          <div><span class="muted small">{{ i18n.pick(p.name, p.nameAr) }}</span><b>{{ i18n.money(price()) }}</b></div>
          <button type="button" class="btn btn-primary" [disabled]="!variant() || stock() === 0" (click)="add(false)"><app-icon name="bag" [size]="18" /> {{ 'cta.add' | t }}</button>
        </div>
      } @else if (state().status === 'error') {
        <app-empty icon="search" [title]="'pdp.notFound' | t" [text]="'pdp.notFoundText' | t">
          <a class="btn btn-primary" routerLink="/shop">{{ 'cta.startShopping' | t }}</a>
        </app-empty>
      } @else {
        <div class="pdp" aria-busy="true">
          <div class="sk" style="aspect-ratio: 1; border-radius: var(--r-xl)"></div>
          <div class="stack">
            <div class="sk sk-line w40"></div><div class="sk sk-line" style="height: 34px"></div><div class="sk sk-line w60"></div>
            <div class="sk sk-line w40" style="height: 30px"></div><div class="sk sk-line" style="height: 90px"></div><div class="sk sk-line" style="height: 52px"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductDetail {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  private readonly cart = inject(Cart);
  private readonly wishlist = inject(Wishlist);
  private readonly recentStore = inject(RecentlyViewed);
  private readonly auth = inject(Auth);
  private readonly toasts = inject(Toasts);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  /** Bound from the route: /product/:slug */
  readonly slug = input.required<string>();

  protected readonly state = queryFrom(() => this.slug(), (s) => this.api.product(s));
  protected readonly product = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.data : null;
  });

  // Selection state
  protected readonly selColor = signal<string | undefined>(undefined);
  protected readonly selSize = signal<string | undefined>(undefined);
  protected readonly qty = signal(1);
  protected readonly activeImg = signal(0);
  protected readonly tab = signal<Tab>('desc');
  protected readonly views = [0, 1, 2, 3];
  protected readonly tabList: { key: Tab; label: string }[] = [
    { key: 'desc', label: 'pdp.description' },
    { key: 'specs', label: 'pdp.specs' },
    { key: 'reviews', label: 'pdp.reviewsTab' },
  ];

  protected readonly colors = computed(() => {
    const p = this.product();
    if (!p) return [];
    const map = new Map<string, { name: string; label: string; hex: string; available: boolean }>();
    for (const v of p.variants) {
      if (!v.color) continue;
      const cur = map.get(v.color);
      map.set(v.color, {
        name: v.color,
        label: this.i18n.pick(v.color, v.colorAr),
        hex: v.colorHex ?? '#999',
        available: (cur?.available ?? false) || v.stock > 0,
      });
    }
    return [...map.values()];
  });

  protected readonly sizes = computed(() => {
    const p = this.product();
    if (!p) return [];
    const color = this.selColor();
    const map = new Map<string, { name: string; available: boolean }>();
    for (const v of p.variants) {
      if (!v.size) continue;
      const inColor = v.color === color;
      const cur = map.get(v.size);
      map.set(v.size, { name: v.size, available: (cur?.available ?? false) || (inColor && v.stock > 0) });
    }
    return [...map.values()];
  });

  protected readonly variant = computed(() => {
    const p = this.product();
    return p?.variants.find((v) => v.color === this.selColor() && v.size === this.selSize()) ?? null;
  });
  protected readonly stock = computed(() => this.variant()?.stock ?? 0);
  protected readonly maxQty = computed(() => Math.max(1, Math.min(this.stock(), 10)));
  protected readonly stockState = computed(() => (this.stock() === 0 ? 'out' : this.stock() <= 5 ? 'low' : 'in'));
  protected readonly price = computed(() => this.variant()?.priceOverride ?? this.product()?.basePrice ?? 0);
  protected readonly compareAt = computed(() => {
    const p = this.product();
    return p?.compareAtPrice && !this.variant()?.priceOverride && p.compareAtPrice > p.basePrice ? p.compareAtPrice : null;
  });
  protected readonly discount = computed(() => {
    const c = this.compareAt();
    return c ? Math.round((1 - this.price() / c) * 100) : 0;
  });
  protected readonly tint = computed(() => this.variant()?.colorHex ?? null);
  protected readonly selectedColorName = computed(() => this.colors().find((c) => c.name === this.selColor())?.label ?? '');
  protected readonly sizeLabel = computed(() => {
    const p = this.product();
    return this.i18n.t(p?.variants.some((v) => /GB|TB/.test(v.size ?? '')) ? 'pdp.storage' : 'pdp.size');
  });
  protected readonly highlights = computed(() => {
    const p = this.product();
    return p ? (this.i18n.lang() === 'ar' ? p.highlightsAr : p.highlights) : [];
  });
  protected readonly wished = computed(() => {
    const p = this.product();
    return !!p && this.wishlist.has(p.id);
  });
  protected readonly crumbs = computed(() => {
    const p = this.product();
    return [
      { label: this.i18n.t('nav.home'), link: '/' },
      { label: this.i18n.t('nav.shop'), link: '/shop' },
      ...(p ? [{ label: this.i18n.pick(p.categoryName, p.categoryNameAr), link: '/shop', query: { category: p.categorySlug } }] : []),
      { label: p ? this.i18n.pick(p.name, p.nameAr) : '' },
    ];
  });

  // Reviews
  private readonly reviewTick = signal(0);
  protected readonly reviews = queryFrom(
    () => ({ id: this.product()?.id ?? 0, tick: this.reviewTick() }),
    ({ id }) => (id ? this.api.reviews(id) : of([])),
  );
  protected readonly distribution = computed(() => {
    const list = this.reviews().data ?? [];
    return [5, 4, 3, 2, 1].map((star) => {
      const count = list.filter((r) => r.rating === star).length;
      return { star, count, pct: list.length ? (count / list.length) * 100 : 0 };
    });
  });
  protected readonly hoverRating = signal(0);
  protected readonly submitting = signal(false);
  protected readonly ratingMissing = signal(false);
  protected readonly reviewForm = new FormGroup({
    rating: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    title: new FormControl('', { nonNullable: true }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
  });

  // Related + recently viewed
  protected readonly related = queryFrom(
    () => this.product()?.id ?? 0,
    (id) => (id ? this.api.related(id) : of([])),
  );
  protected readonly recent = queryFrom(
    () => ({ ids: this.recentStore.ids().filter((i) => i !== this.product()?.id).slice(0, 8), p: this.product()?.id }),
    ({ ids }) => (ids.length ? this.api.productsByIds(ids) : of([])),
  );

  constructor() {
    // Reset selections whenever a different product has loaded.
    effect(() => {
      const p = this.product();
      if (!p) return;
      untracked(() => {
        const first = p.variants.find((v) => v.stock > 0) ?? p.variants[0];
        this.selColor.set(first?.color);
        this.selSize.set(first?.size);
        this.qty.set(1);
        this.activeImg.set(0);
        this.tab.set('desc');
        this.recentStore.add(p.id);
        this.title.setTitle(`${this.i18n.pick(p.name, p.nameAr)} · ${environment.storeName}`);
      });
    });

    // Keep quantity within stock when the variant changes.
    effect(() => {
      const max = this.maxQty();
      if (untracked(this.qty) > max) this.qty.set(max);
    });
  }

  protected pickColor(color: string): void {
    this.selColor.set(color);
    // If the current size isn't offered in this color, fall back to the first one that is.
    const p = this.product();
    if (!p) return;
    const ok = p.variants.some((v) => v.color === color && v.size === this.selSize() && v.stock > 0);
    if (!ok) {
      const alt = p.variants.find((v) => v.color === color && v.stock > 0) ?? p.variants.find((v) => v.color === color);
      this.selSize.set(alt?.size);
    }
    this.qty.set(1);
  }

  protected setRating(n: number): void {
    this.reviewForm.controls.rating.setValue(n);
    this.ratingMissing.set(false);
  }

  protected step(delta: number): void {
    this.activeImg.update((i) => (i + delta + this.views.length) % this.views.length);
  }

  protected eta(days: number): string {
    return this.i18n.date(new Date(Date.now() + days * 86_400_000), { day: 'numeric', month: 'short' });
  }

  protected openReviews(): void {
    this.tab.set('reviews');
    setTimeout(() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  protected toggleWish(): void {
    const p = this.product();
    if (!p) return;
    const added = this.wishlist.toggle(p.id);
    this.toasts.success(this.i18n.t(added ? 'wish.added' : 'wish.removed'));
  }

  protected add(buyNow: boolean): void {
    const p = this.product();
    const v = this.variant();
    if (!p || !v || v.stock === 0) return;
    const inCart = this.cart.add(p, v, this.qty());
    if (buyNow) {
      void this.router.navigate(['/checkout']);
      return;
    }
    if (inCart >= Math.min(v.stock, 10)) this.toasts.info(this.i18n.t('toast.maxQty'));
    this.ui.openCart();
  }

  protected submitReview(): void {
    const p = this.product();
    const f = this.reviewForm;
    f.markAllAsTouched();
    this.ratingMissing.set(f.controls.rating.value < 1);
    if (!p || f.invalid) return;
    this.submitting.set(true);
    const user = this.auth.user();
    this.api
      .addReview(p.id, {
        rating: f.controls.rating.value,
        title: f.controls.title.value.trim() || this.i18n.t('review.defaultTitle'),
        comment: f.controls.comment.value.trim(),
        author: user?.name ?? this.i18n.t('review.guest'),
      })
      .subscribe({
        next: () => {
          this.toasts.success(this.i18n.t('review.thanks'));
          f.reset({ rating: 0, title: '', comment: '' });
          this.submitting.set(false);
          this.reviewTick.update((n) => n + 1);
        },
        error: (e: unknown) => {
          this.toasts.error(this.i18n.t(e instanceof ApiError ? e.code : 'error.generic'));
          this.submitting.set(false);
        },
      });
  }
}
