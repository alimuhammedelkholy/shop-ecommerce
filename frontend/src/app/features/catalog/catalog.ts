import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { ProductQuery, SortKey } from '../../core/models';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { Pagination } from '../../shared/pagination';
import { ProductGrid } from '../../shared/product-grid';
import { Rating } from '../../shared/rating';

const SORTS: SortKey[] = ['featured', 'newest', 'popular', 'rating', 'price-asc', 'price-desc'];
const PAGE_SIZE = 12;

const toNum = (v: string | undefined): number | undefined => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

interface Chip {
  key: string;
  label: string;
  patch: Record<string, string | null>;
}

/**
 * Product listing. The URL is the single source of truth: every filter lives in the query string
 * (so links are shareable and back/forward works) and arrives here as a component input.
 */
@Component({
  selector: 'app-catalog',
  imports: [Icon, Rating, ProductGrid, Pagination, Breadcrumbs, EmptyState, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'filtersOpen.set(false)' },
  template: `
    <div class="container page">
      <app-breadcrumbs [items]="crumbs()" />

      <div class="page-head">
        <div>
          <h1>{{ heading() }}</h1>
          <p class="muted" aria-live="polite">
            @if (state().data; as d) { {{ 'shop.results' | t: { n: i18n.num(d.total) } }} } @else { &nbsp; }
          </p>
        </div>
        <div class="toolbar">
          <button type="button" class="btn btn-secondary filter-toggle" (click)="filtersOpen.set(true)">
            <app-icon name="filter" [size]="17" /> {{ 'shop.filters' | t }}
            @if (chips().length) { <span class="count-badge static">{{ chips().length }}</span> }
          </button>
          <label class="select-wrap">
            <span class="sr-only">{{ 'shop.sort' | t }}</span>
            <select class="select" (change)="onSort($event)" [attr.aria-label]="'shop.sort' | t">
              @for (s of sorts; track s) {
                <option [value]="s" [selected]="s === query().sort">{{ 'sort.' + s | t }}</option>
              }
            </select>
          </label>
          <div class="view-toggle" role="group" [attr.aria-label]="'shop.view' | t">
            <button type="button" [class.active]="layout() === 'grid'" (click)="layout.set('grid')" [attr.aria-pressed]="layout() === 'grid'" [attr.aria-label]="'shop.grid' | t"><app-icon name="grid" [size]="18" /></button>
            <button type="button" [class.active]="layout() === 'list'" (click)="layout.set('list')" [attr.aria-pressed]="layout() === 'list'" [attr.aria-label]="'shop.list' | t"><app-icon name="list" [size]="18" /></button>
          </div>
        </div>
      </div>

      @if (chips().length) {
        <div class="chips" role="list">
          @for (c of chips(); track c.key) {
            <button type="button" role="listitem" class="chip" (click)="patch(c.patch)">
              {{ c.label }} <app-icon name="close" [size]="13" />
            </button>
          }
          <button type="button" class="chip chip-clear" (click)="clearAll()">{{ 'shop.clear' | t }}</button>
        </div>
      }

      <div class="shop-layout">
        @if (filtersOpen()) { <div class="overlay" (click)="filtersOpen.set(false)"></div> }
        <aside class="filters" [class.open]="filtersOpen()" [attr.aria-label]="'shop.filters' | t">
          <div class="filters-head">
            <h2>{{ 'shop.filters' | t }}</h2>
            <button type="button" class="icon-btn" (click)="filtersOpen.set(false)" [attr.aria-label]="'a11y.close' | t"><app-icon name="close" [size]="20" /></button>
          </div>

          <div class="filters-body">
            <details class="fgroup" open>
              <summary>{{ 'shop.category' | t }}<app-icon name="chevron-down" [size]="16" /></summary>
              <ul class="flist">
                <li>
                  <label class="check"><input type="radio" name="cat" [checked]="!query().category" (change)="patch({ category: null })" />
                    <span>{{ 'shop.allCategories' | t }}</span></label>
                </li>
                @for (c of categories(); track c.id) {
                  <li>
                    <label class="check"><input type="radio" name="cat" [checked]="query().category === c.slug" (change)="patch({ category: c.slug })" />
                      <span>{{ i18n.pick(c.name, c.nameAr) }}</span>
                      <small class="count">{{ i18n.num(catCount(c.slug)) }}</small></label>
                  </li>
                }
              </ul>
            </details>

            <details class="fgroup" open>
              <summary>{{ 'shop.brand' | t }}<app-icon name="chevron-down" [size]="16" /></summary>
              <ul class="flist">
                @for (b of brands(); track b.id) {
                  <li>
                    <label class="check"><input type="checkbox" [checked]="query().brands?.includes(b.slug)" (change)="toggleBrand(b.slug)" />
                      <span>{{ i18n.pick(b.name, b.nameAr) }}</span>
                      <small class="count">{{ i18n.num(brandCount(b.slug)) }}</small></label>
                  </li>
                }
              </ul>
            </details>

            <details class="fgroup" open>
              <summary>{{ 'shop.price' | t }}<app-icon name="chevron-down" [size]="16" /></summary>
              <form class="price-form" (submit)="applyPrice($event)">
                <input class="input" type="number" min="0" inputmode="numeric" [placeholder]="'shop.min' | t" [attr.aria-label]="'shop.min' | t" [value]="minDraft()" (input)="minDraft.set(val($event))" />
                <span aria-hidden="true">–</span>
                <input class="input" type="number" min="0" inputmode="numeric" [placeholder]="'shop.max' | t" [attr.aria-label]="'shop.max' | t" [value]="maxDraft()" (input)="maxDraft.set(val($event))" />
                <button type="submit" class="btn btn-soft btn-sm">{{ 'shop.apply' | t }}</button>
              </form>
              <div class="preset-row">
                @for (p of presets; track p.label) {
                  <button type="button" class="chip" [class.active]="isPreset(p)" (click)="patch({ min: p.min === null ? null : '' + p.min, max: p.max === null ? null : '' + p.max })">{{ p.label }}</button>
                }
              </div>
            </details>

            <details class="fgroup" open>
              <summary>{{ 'shop.rating' | t }}<app-icon name="chevron-down" [size]="16" /></summary>
              <div class="rating-filter">
                @for (r of [4, 3, 2]; track r) {
                  <button type="button" class="rating-opt" [class.active]="query().rating === r" (click)="patch({ rating: query().rating === r ? null : '' + r })">
                    <app-rating [value]="r" [size]="15" /> <span>{{ 'shop.andUp' | t }}</span>
                  </button>
                }
              </div>
            </details>

            <label class="switch-row">
              <span><b>{{ 'shop.onSale' | t }}</b><small class="muted">{{ 'shop.onSaleHint' | t }}</small></span>
              <input type="checkbox" class="switch" role="switch" [checked]="query().sale" (change)="patch({ sale: query().sale ? null : 'true' })" />
            </label>
          </div>

          <div class="filters-foot">
            <button type="button" class="btn btn-primary btn-block" (click)="filtersOpen.set(false)">
              {{ 'shop.show' | t: { n: i18n.num(state().data?.total ?? 0) } }}
            </button>
            <button type="button" class="btn btn-secondary btn-block" (click)="clearAll()">{{ 'shop.clear' | t }}</button>
          </div>
        </aside>

        <section class="results" [attr.aria-label]="'shop.title' | t">
          @if (state().status === 'error') {
            <app-empty icon="alert" [title]="'error.generic' | t" [text]="'error.retry' | t">
              <button type="button" class="btn btn-primary" (click)="reload()">{{ 'cta.retry' | t }}</button>
            </app-empty>
          } @else if (state().status === 'ready' && !items().length) {
            <app-empty icon="search" [title]="'shop.noResults' | t" [text]="'shop.noResultsText' | t">
              <button type="button" class="btn btn-primary" (click)="clearAll()">{{ 'shop.clear' | t }}</button>
            </app-empty>
          } @else {
            <div [class.is-refreshing]="state().status === 'loading' && !!state().data">
              <app-product-grid [items]="items()" [loading]="state().status === 'loading'" [layout]="layout()" [skeletons]="12" />
            </div>
            <app-pagination [page]="state().data?.page ?? 1" [pages]="state().data?.pages ?? 1" (pageChange)="goPage($event)" />
          }
        </section>
      </div>
    </div>
  `,
})
export class Catalog {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  private readonly router = inject(Router);

  // Route query params, bound by withComponentInputBinding()
  readonly q = input<string>();
  readonly category = input<string>();
  readonly brand = input<string>();
  readonly min = input<string>();
  readonly max = input<string>();
  readonly rating = input<string>();
  readonly sale = input<string>();
  readonly sort = input<string>();
  readonly page = input<string>();

  protected readonly sorts = SORTS;
  protected readonly layout = signal<'grid' | 'list'>('grid');
  protected readonly filtersOpen = signal(false);
  protected readonly minDraft = signal('');
  protected readonly maxDraft = signal('');
  private readonly reloadTick = signal(0);

  protected readonly categories = toSignal(this.api.categories(), { initialValue: [] });
  protected readonly brands = toSignal(this.api.brands(), { initialValue: [] });

  protected readonly query = computed<ProductQuery>(() => {
    const sort = this.sort() as SortKey;
    return {
      q: this.q()?.trim() || undefined,
      category: this.category() || undefined,
      brands: (this.brand() ?? '').split(',').filter(Boolean),
      min: toNum(this.min()),
      max: toNum(this.max()),
      rating: toNum(this.rating()),
      sale: this.sale() === 'true',
      sort: SORTS.includes(sort) ? sort : 'featured',
      page: Math.max(1, toNum(this.page()) ?? 1),
      pageSize: PAGE_SIZE,
    };
  });

  protected readonly state = queryFrom(
    () => ({ q: this.query(), tick: this.reloadTick() }),
    ({ q }) => this.api.products(q),
  );
  protected readonly items = computed(() => this.state().data?.items ?? []);
  private readonly facets = computed(() => this.state().data?.facets);

  protected catCount(slug: string): number {
    return this.facets()?.categories[slug] ?? 0;
  }
  protected brandCount(slug: string): number {
    return this.facets()?.brands[slug] ?? 0;
  }

  protected readonly presets = [
    { label: '< 50', min: null, max: 50 },
    { label: '50 – 200', min: 50, max: 200 },
    { label: '200 – 500', min: 200, max: 500 },
    { label: '500+', min: 500, max: null },
  ];

  protected readonly activeCategory = computed(() => this.categories().find((c) => c.slug === this.query().category));

  protected readonly heading = computed(() => {
    const q = this.query();
    if (q.q) return this.i18n.t('shop.searchFor', { q: q.q });
    const c = this.activeCategory();
    if (c) return this.i18n.pick(c.name, c.nameAr);
    if (q.sale) return this.i18n.t('nav.deals');
    return this.i18n.t('shop.title');
  });

  protected readonly crumbs = computed(() => [
    { label: this.i18n.t('nav.home'), link: '/' },
    { label: this.i18n.t('nav.shop'), link: this.query().category || this.query().q ? '/shop' : undefined },
    ...(this.activeCategory() ? [{ label: this.heading() }] : []),
  ]);

  protected readonly chips = computed<Chip[]>(() => {
    const q = this.query();
    const out: Chip[] = [];
    if (q.q) out.push({ key: 'q', label: `“${q.q}”`, patch: { q: null } });
    const c = this.activeCategory();
    if (c) out.push({ key: 'c', label: this.i18n.pick(c.name, c.nameAr), patch: { category: null } });
    for (const slug of q.brands ?? []) {
      const b = this.brands().find((x) => x.slug === slug);
      out.push({ key: 'b' + slug, label: b ? this.i18n.pick(b.name, b.nameAr) : slug, patch: { brand: this.withoutBrand(slug) } });
    }
    if (q.min !== undefined || q.max !== undefined) {
      const lo = q.min !== undefined ? this.i18n.money(q.min) : '';
      const hi = q.max !== undefined ? this.i18n.money(q.max) : '';
      out.push({ key: 'p', label: lo && hi ? `${lo} – ${hi}` : lo ? `≥ ${lo}` : `≤ ${hi}`, patch: { min: null, max: null } });
    }
    if (q.rating) out.push({ key: 'r', label: `${q.rating}★ +`, patch: { rating: null } });
    if (q.sale) out.push({ key: 's', label: this.i18n.t('shop.onSale'), patch: { sale: null } });
    return out;
  });

  constructor() {
    // Keep the price inputs in sync with the URL.
    effect(() => {
      this.minDraft.set(this.min() ?? '');
      this.maxDraft.set(this.max() ?? '');
    });
  }

  protected val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected onSort(e: Event): void {
    this.patch({ sort: (e.target as HTMLSelectElement).value === 'featured' ? null : (e.target as HTMLSelectElement).value });
  }

  protected toggleBrand(slug: string): void {
    const current = this.query().brands ?? [];
    const next = current.includes(slug) ? current.filter((b) => b !== slug) : [...current, slug];
    this.patch({ brand: next.length ? next.join(',') : null });
  }

  private withoutBrand(slug: string): string | null {
    const next = (this.query().brands ?? []).filter((b) => b !== slug);
    return next.length ? next.join(',') : null;
  }

  protected applyPrice(e: Event): void {
    e.preventDefault();
    let lo = toNum(this.minDraft());
    let hi = toNum(this.maxDraft());
    if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
    this.patch({ min: lo !== undefined ? String(lo) : null, max: hi !== undefined ? String(hi) : null });
  }

  protected isPreset(p: { min: number | null; max: number | null }): boolean {
    const q = this.query();
    return (q.min ?? null) === p.min && (q.max ?? null) === p.max;
  }

  /** Merge changes into the query string. Any filter change resets pagination. */
  protected patch(changes: Record<string, string | null>): void {
    void this.router.navigate([], {
      queryParams: { page: null, ...changes },
      queryParamsHandling: 'merge',
    });
  }

  protected goPage(page: number): void {
    void this.router.navigate([], { queryParams: { page: page > 1 ? page : null }, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected clearAll(): void {
    void this.router.navigate([], { queryParams: {} });
    this.filtersOpen.set(false);
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }
}
