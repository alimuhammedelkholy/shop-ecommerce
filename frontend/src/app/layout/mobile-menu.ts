import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { I18n, TPipe } from '../core/i18n';
import { ShopApi } from '../core/shop-api';
import { Auth } from '../core/stores';
import { Theme } from '../core/theme';
import { Ui } from '../core/ui';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-mobile-menu',
  imports: [RouterLink, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'ui.menuOpen.set(false)' },
  template: `
    @if (ui.menuOpen()) {
      <div class="overlay" (click)="ui.menuOpen.set(false)"></div>
      <aside class="drawer drawer-start" role="dialog" aria-modal="true" [attr.aria-label]="'a11y.menu' | t">
        <div class="drawer-head">
          <span class="logo"><span class="logo-mark"><app-icon name="bag" [size]="18" [stroke]="2.4" /></span><span class="logo-text">{{ storeName }}</span></span>
          <button type="button" class="icon-btn" (click)="ui.menuOpen.set(false)" [attr.aria-label]="'a11y.close' | t"><app-icon name="close" [size]="20" /></button>
        </div>
        <nav class="drawer-body menu-list">
          <a routerLink="/" class="menu-link"><app-icon name="home" [size]="20" /> {{ 'nav.home' | t }}</a>
          <a routerLink="/shop" class="menu-link"><app-icon name="store" [size]="20" /> {{ 'nav.shop' | t }}</a>
          <a routerLink="/shop" [queryParams]="{ sale: 'true' }" class="menu-link"><app-icon name="percent" [size]="20" /> {{ 'nav.deals' | t }}</a>
          <a routerLink="/wishlist" class="menu-link"><app-icon name="heart" [size]="20" /> {{ 'nav.wishlist' | t }}</a>
          <a [routerLink]="auth.isLoggedIn() ? '/account' : '/login'" class="menu-link"><app-icon name="user" [size]="20" /> {{ auth.isLoggedIn() ? ('nav.account' | t) : ('nav.signin' | t) }}</a>

          <h3 class="menu-title">{{ 'nav.categories' | t }}</h3>
          @for (c of categories(); track c.id) {
            <a routerLink="/shop" [queryParams]="{ category: c.slug }" class="menu-link">
              <span class="mega-icon" [style.--h]="c.hue"><app-icon [name]="c.glyph" [size]="18" /></span>
              {{ i18n.pick(c.name, c.nameAr) }}
            </a>
          }
        </nav>
        <div class="drawer-foot menu-foot">
          <button type="button" class="btn btn-secondary" (click)="i18n.toggle()"><app-icon name="globe" [size]="18" /> {{ i18n.lang() === 'en' ? 'العربية' : 'English' }}</button>
          <button type="button" class="btn btn-secondary" (click)="theme.toggle()"><app-icon [name]="theme.mode() === 'dark' ? 'sun' : 'moon'" [size]="18" /> {{ (theme.mode() === 'dark' ? 'theme.light' : 'theme.dark') | t }}</button>
        </div>
      </aside>
    }
  `,
})
export class MobileMenu {
  protected readonly ui = inject(Ui);
  protected readonly i18n = inject(I18n);
  protected readonly theme = inject(Theme);
  protected readonly auth = inject(Auth);
  protected readonly storeName = environment.storeName;
  protected readonly categories = toSignal(inject(ShopApi).categories(), { initialValue: [] });
}
