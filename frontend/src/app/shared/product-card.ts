import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18n, TPipe } from '../core/i18n';
import { Product } from '../core/models';
import { Cart, Wishlist } from '../core/stores';
import { Toasts } from '../core/toast';
import { Ui } from '../core/ui';
import { Art } from './art';
import { Icon } from './icon';
import { Rating } from './rating';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, Art, Icon, Rating, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    <article class="pcard" [class.pcard-list]="layout() === 'list'">
      <a class="pcard-media" [routerLink]="['/product', p.slug]" tabindex="-1" aria-hidden="true">
        <app-art [hue]="p.hue" [glyph]="p.glyph" />
        <div class="pcard-badges">
          @if (soldOut()) {
            <span class="badge badge-muted">{{ 'badge.soldOut' | t }}</span>
          } @else {
            @if (discount() > 0) { <span class="badge badge-sale">-{{ discount() }}%</span> }
            @if (isNew()) { <span class="badge badge-new">{{ 'badge.new' | t }}</span> }
          }
        </div>
      </a>

      <button
        type="button"
        class="pcard-wish"
        [class.active]="wished()"
        (click)="toggleWish()"
        [attr.aria-pressed]="wished()"
        [attr.aria-label]="(wished() ? 'wish.remove' : 'wish.add') | t"
      >
        <app-icon name="heart" [size]="18" [filled]="wished()" />
      </button>

      <div class="pcard-body">
        <span class="pcard-brand">{{ i18n.pick(p.brandName, p.brandNameAr) }}</span>
        <a class="pcard-title" [routerLink]="['/product', p.slug]">{{ i18n.pick(p.name, p.nameAr) }}</a>

        <div class="pcard-rating">
          <app-rating [value]="p.averageRating" [size]="14" />
          <span class="pcard-reviews">{{ p.averageRating.toFixed(1) }} ({{ i18n.num(p.reviewCount) }})</span>
        </div>

        @if (layout() === 'list') {
          <p class="pcard-desc">{{ i18n.pick(p.description, p.descriptionAr) }}</p>
        }

        @if (swatches().length > 1) {
          <div class="swatches-mini" aria-hidden="true">
            @for (c of swatches(); track c) { <span class="swatch-dot" [style.background]="c"></span> }
          </div>
        }

        <div class="pcard-foot">
          <div class="price">
            <span class="price-now">{{ i18n.money(p.basePrice) }}</span>
            @if (p.compareAtPrice) { <s class="price-old">{{ i18n.money(p.compareAtPrice) }}</s> }
          </div>
          <button type="button" class="btn btn-primary btn-sm pcard-add" (click)="quickAdd()" [disabled]="soldOut()">
            <app-icon [name]="needsOptions() ? 'eye' : 'plus'" [size]="16" />
            {{ (needsOptions() ? 'cta.options' : 'cta.add') | t }}
          </button>
        </div>
      </div>
    </article>
  `,
})
export class ProductCard {
  protected readonly i18n = inject(I18n);
  private readonly cart = inject(Cart);
  private readonly wishlist = inject(Wishlist);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly ui = inject(Ui);

  readonly product = input.required<Product>();
  readonly layout = input<'grid' | 'list'>('grid');

  protected readonly wished = computed(() => this.wishlist.has(this.product().id));
  protected readonly discount = computed(() => {
    const p = this.product();
    return p.compareAtPrice && p.compareAtPrice > p.basePrice
      ? Math.round((1 - p.basePrice / p.compareAtPrice) * 100)
      : 0;
  });
  protected readonly isNew = computed(() => Date.now() - new Date(this.product().createdAt).getTime() < 30 * 86_400_000);
  protected readonly soldOut = computed(() => this.product().variants.every((v) => v.stock === 0));
  protected readonly needsOptions = computed(() => this.product().variants.length > 1);
  protected readonly swatches = computed(() => {
    const set = new Set(this.product().variants.map((v) => v.colorHex).filter((c): c is string => !!c));
    return [...set].slice(0, 5);
  });

  protected toggleWish(): void {
    const added = this.wishlist.toggle(this.product().id);
    this.toasts.success(this.i18n.t(added ? 'wish.added' : 'wish.removed'));
  }

  protected quickAdd(): void {
    const p = this.product();
    if (this.needsOptions()) {
      void this.router.navigate(['/product', p.slug]);
      return;
    }
    const variant = p.variants.find((v) => v.stock > 0);
    if (!variant) return;
    this.cart.add(p, variant, 1);
    this.toasts.success(this.i18n.t('toast.added', { name: this.i18n.pick(p.name, p.nameAr) }), {
      label: this.i18n.t('cta.viewCart'),
      run: () => this.ui.openCart(),
    });
  }
}
