import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Wishlist } from '../../core/stores';
import { EmptyState } from '../../shared/empty-state';
import { ProductGrid } from '../../shared/product-grid';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, EmptyState, ProductGrid, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <h1 class="page-title">{{ 'nav.wishlist' | t }} @if (wishlist.count()) { <span class="muted">({{ i18n.num(wishlist.count()) }})</span> }</h1>
      @if (!wishlist.count()) {
        <app-empty icon="heart" [title]="'wish.empty' | t" [text]="'wish.emptyText' | t">
          <a class="btn btn-primary btn-lg" routerLink="/shop">{{ 'cta.startShopping' | t }}</a>
        </app-empty>
      } @else {
        <app-product-grid [items]="items()" [loading]="state().status === 'loading'" [skeletons]="wishlist.count()" />
      }
    </div>
  `,
})
export class WishlistPage {
  protected readonly wishlist = inject(Wishlist);
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  protected readonly state = queryFrom(() => this.wishlist.all(), (ids) => this.api.productsByIds(ids));
  /** Hide products immediately when removed, even before the next fetch completes. */
  protected readonly items = computed(() => (this.state().data ?? []).filter((p) => this.wishlist.has(p.id)));
}
