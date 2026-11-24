import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../core/i18n';
import { SortKey } from '../../core/models';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Carousel } from '../../shared/carousel';
import { Icon } from '../../shared/icon';
import { ProductCard } from '../../shared/product-card';

type Tab = { key: SortKey; label: string };

@Component({
  selector: 'app-tabs-section',
  imports: [RouterLink, Icon, Carousel, ProductCard, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2>{{ 'home.picks' | t }}</h2>
          <div class="tabs" role="tablist" [attr.aria-label]="'home.picks' | t">
            @for (t of tabs; track t.key) {
              <button type="button" class="tab" role="tab" [class.active]="tab() === t.key" [attr.aria-selected]="tab() === t.key" (click)="tab.set(t.key)">
                {{ t.label | t }}
              </button>
            }
          </div>
          <a class="link-more" routerLink="/shop">{{ 'cta.seeAll' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="16" /></a>
        </div>

        <app-carousel>
          @if (state().status === 'loading' && !state().data) {
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div class="slide"><div class="pcard skeleton-card"><div class="pcard-media sk"></div><div class="pcard-body"><div class="sk sk-line w40"></div><div class="sk sk-line"></div><div class="sk sk-line w60"></div></div></div></div>
            }
          } @else {
            @for (p of state().data?.items ?? []; track p.id) {
              <div class="slide"><app-product-card [product]="p" /></div>
            }
          }
        </app-carousel>
      </div>
    </section>
  `,
})
export class TabsSection {
  private readonly api = inject(ShopApi);
  protected readonly tab = signal<SortKey>('featured');
  protected readonly tabs: Tab[] = [
    { key: 'featured', label: 'tab.featured' },
    { key: 'newest', label: 'tab.new' },
    { key: 'popular', label: 'tab.best' },
    { key: 'rating', label: 'tab.top' },
  ];

  protected readonly state = queryFrom(
    () => this.tab(),
    (sort) => this.api.products({ sort, page: 1, pageSize: 10 }),
  );
}
