import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Product } from '../core/models';
import { ProductCard } from './product-card';

/** Responsive grid/list of product cards with skeleton placeholders while loading. */
@Component({
  selector: 'app-product-grid',
  imports: [ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid-products" [class.is-list]="layout() === 'list'" [attr.aria-busy]="loading()">
      @if (loading() && !items().length) {
        @for (i of placeholders(); track i) {
          <div class="pcard skeleton-card" [class.pcard-list]="layout() === 'list'" aria-hidden="true">
            <div class="pcard-media sk"></div>
            <div class="pcard-body">
              <div class="sk sk-line w40"></div>
              <div class="sk sk-line"></div>
              <div class="sk sk-line w60"></div>
              <div class="sk sk-line w40"></div>
            </div>
          </div>
        }
      } @else {
        @for (p of items(); track p.id) {
          <app-product-card [product]="p" [layout]="layout()" />
        }
      }
    </div>
  `,
})
export class ProductGrid {
  readonly items = input<Product[]>([]);
  readonly loading = input<boolean>(false);
  readonly layout = input<'grid' | 'list'>('grid');
  readonly skeletons = input<number>(8);
  protected readonly placeholders = computed(() => Array.from({ length: this.skeletons() }, (_, i) => i));
}
