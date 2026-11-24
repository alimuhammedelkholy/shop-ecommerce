import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, timer } from 'rxjs';
import { I18n, TPipe } from '../../core/i18n';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Icon } from '../../shared/icon';
import { ProductGrid } from '../../shared/product-grid';

/** "Flash deals" block with a live countdown to the end of the day. */
@Component({
  selector: 'app-deals-section',
  imports: [RouterLink, Icon, ProductGrid, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section deals">
      <div class="container">
        <div class="section-head">
          <div class="deal-title">
            <span class="deal-bolt"><app-icon name="zap" [size]="20" [filled]="true" /></span>
            <div>
              <h2>{{ 'home.deals' | t }}</h2>
              <p class="muted">{{ 'home.dealsSub' | t }}</p>
            </div>
          </div>
          <div class="countdown" role="timer" [attr.aria-label]="'home.endsIn' | t">
            <span class="countdown-label">{{ 'home.endsIn' | t }}</span>
            <div class="countdown-cells">
              <span><b>{{ i18n.pad2(parts().h) }}</b><small>{{ 'time.h' | t }}</small></span>
              <i>:</i>
              <span><b>{{ i18n.pad2(parts().m) }}</b><small>{{ 'time.m' | t }}</small></span>
              <i>:</i>
              <span><b>{{ i18n.pad2(parts().s) }}</b><small>{{ 'time.s' | t }}</small></span>
            </div>
          </div>
          <a class="link-more" routerLink="/shop" [queryParams]="{ sale: 'true' }">
            {{ 'cta.seeAll' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="16" />
          </a>
        </div>
        <app-product-grid [items]="state().data?.items ?? []" [loading]="state().status === 'loading'" [skeletons]="4" />
      </div>
    </section>
  `,
})
export class DealsSection {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);

  protected readonly state = queryFrom(
    () => 'deals',
    () => this.api.products({ sale: true, sort: 'popular', page: 1, pageSize: 4 }),
  );

  private readonly now = toSignal(timer(0, 1000).pipe(map(() => Date.now())), { initialValue: Date.now() });

  protected readonly parts = computed(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const left = Math.max(0, Math.floor((end.getTime() - this.now()) / 1000));
    return { h: Math.floor(left / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 };
  });
}
