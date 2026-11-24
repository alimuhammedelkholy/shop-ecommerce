import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Art } from '../../shared/art';
import { Icon } from '../../shared/icon';
import { DealsSection } from './deals-section';
import { TabsSection } from './tabs-section';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Art, Icon, DealsSection, TabsSection, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"><app-icon name="sparkles" [size]="14" /> {{ 'hero.eyebrow' | t }}</span>
          <h1>{{ 'hero.title1' | t }} <span class="grad">{{ 'hero.title2' | t }}</span></h1>
          <p class="hero-text">{{ 'hero.text' | t }}</p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg" routerLink="/shop">{{ 'cta.shopNow' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="18" /></a>
            <a class="btn btn-secondary btn-lg" routerLink="/shop" [queryParams]="{ sale: 'true' }"><app-icon name="percent" [size]="18" /> {{ 'nav.deals' | t }}</a>
          </div>
          <ul class="hero-stats">
            <li><b>{{ i18n.num(50000) }}+</b><span>{{ 'hero.stat1' | t }}</span></li>
            <li><b>{{ i18n.num(4.8) }}★</b><span>{{ 'hero.stat2' | t }}</span></li>
            <li><b>{{ i18n.num(24) }}h</b><span>{{ 'hero.stat3' | t }}</span></li>
          </ul>
        </div>

        <div class="hero-visual" aria-hidden="false">
          @for (p of heroProducts(); track p.id; let i = $index) {
            <a class="hero-card" [attr.data-i]="i" [routerLink]="['/product', p.slug]">
              <div class="hero-card-art"><app-art [hue]="p.hue" [glyph]="p.glyph" [view]="i" /></div>
              <div class="hero-card-info">
                <span>{{ i18n.pick(p.name, p.nameAr) }}</span>
                <b>{{ i18n.money(p.basePrice) }}</b>
              </div>
            </a>
          }
          <div class="hero-chip hero-chip-1"><app-icon name="truck" [size]="16" /> {{ 'trust.ship' | t }}</div>
          <div class="hero-chip hero-chip-2"><app-icon name="shield" [size]="16" /> {{ 'trust.secure' | t }}</div>
        </div>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="trust">
      <div class="container trust-grid">
        @for (t of trust; track t.icon) {
          <div class="trust-item">
            <span class="trust-icon"><app-icon [name]="t.icon" [size]="22" /></span>
            <div><b>{{ t.title | t }}</b><span>{{ t.text | t }}</span></div>
          </div>
        }
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2>{{ 'home.categories' | t }}</h2>
          <a class="link-more" routerLink="/shop">{{ 'cta.seeAll' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="16" /></a>
        </div>
        <div class="cat-grid">
          @for (c of categories(); track c.id) {
            <a class="cat-tile" routerLink="/shop" [queryParams]="{ category: c.slug }" [style.--h]="c.hue">
              <span class="cat-icon"><app-icon [name]="c.glyph" [size]="30" [stroke]="1.6" /></span>
              <span class="cat-name">{{ i18n.pick(c.name, c.nameAr) }}</span>
              <app-icon class="cat-arrow flip-rtl" name="arrow-right" [size]="16" />
            </a>
          } @empty {
            @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) { <div class="cat-tile sk" style="height: 96px"></div> }
          }
        </div>
      </div>
    </section>

    <!-- Below the fold: loaded lazily when scrolled into view -->
    @defer (on viewport) {
      <app-deals-section />
    } @placeholder (minimum 150ms) {
      <div class="defer-ph" aria-hidden="true"></div>
    }

    @defer (on viewport) {
      <app-tabs-section />
    } @placeholder (minimum 150ms) {
      <div class="defer-ph" aria-hidden="true"></div>
    }

    @defer (on viewport) {
      <section class="section">
        <div class="container promo-grid">
          <a class="promo promo-a" routerLink="/shop" [queryParams]="{ category: 'audio' }">
            <span class="eyebrow light">{{ 'promo.a.eyebrow' | t }}</span>
            <h3>{{ 'promo.a.title' | t }}</h3>
            <p>{{ 'promo.a.text' | t }}</p>
            <span class="promo-cta">{{ 'cta.shopNow' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="16" /></span>
            <app-icon class="promo-deco" name="headphones" size="100%" [stroke]="1" />
          </a>
          <a class="promo promo-b" routerLink="/shop" [queryParams]="{ category: 'footwear' }">
            <span class="eyebrow light">{{ 'promo.b.eyebrow' | t }}</span>
            <h3>{{ 'promo.b.title' | t }}</h3>
            <p>{{ 'promo.b.text' | t }}</p>
            <span class="promo-cta">{{ 'cta.shopNow' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="16" /></span>
            <app-icon class="promo-deco" name="shoe" size="100%" [stroke]="1" />
          </a>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head"><h2>{{ 'home.loved' | t }}</h2></div>
          <div class="quotes">
            @for (q of quotes; track q.name) {
              <figure class="quote">
                <div class="quote-stars" aria-label="5 / 5">★★★★★</div>
                <blockquote>{{ q.text | t }}</blockquote>
                <figcaption><span class="avatar">{{ q.name.charAt(0) }}</span><span><b>{{ q.name }}</b><small>{{ q.where | t }}</small></span></figcaption>
              </figure>
            }
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="brand-strip">
            <span class="muted">{{ 'home.brands' | t }}</span>
            @for (b of brands(); track b.id) { <b class="brand-pill">{{ i18n.pick(b.name, b.nameAr) }}</b> }
          </div>
        </div>
      </section>
    } @placeholder {
      <div class="defer-ph" aria-hidden="true"></div>
    }
  `,
})
export class Home {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);

  protected readonly categories = toSignal(this.api.categories(), { initialValue: [] });
  protected readonly brands = toSignal(this.api.brands(), { initialValue: [] });
  private readonly featured = queryFrom(
    () => 'hero',
    () => this.api.products({ sort: 'featured', page: 1, pageSize: 3 }),
  );
  protected readonly heroProducts = computed(() => this.featured().data?.items ?? []);

  protected readonly trust = [
    { icon: 'truck', title: 'trust.ship', text: 'trust.shipText' },
    { icon: 'shield', title: 'trust.secure', text: 'trust.secureText' },
    { icon: 'undo', title: 'trust.returns', text: 'trust.returnsText' },
    { icon: 'headset', title: 'trust.support', text: 'trust.supportText' },
  ];

  protected readonly quotes = [
    { name: 'Sara M.', text: 'quote.1', where: 'quote.where1' },
    { name: 'Omar K.', text: 'quote.2', where: 'quote.where2' },
    { name: 'Layla H.', text: 'quote.3', where: 'quote.where3' },
  ];
}
