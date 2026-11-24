import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../environments/environment';
import { I18n, TPipe } from '../core/i18n';
import { ShopApi } from '../core/shop-api';
import { Auth, Cart, Wishlist } from '../core/stores';
import { Theme } from '../core/theme';
import { Ui } from '../core/ui';
import { Icon } from '../shared/icon';
import { Search } from './search';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon, TPipe, Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
    '(document:click)': 'onDocClick($event)',
    '(document:keydown.escape)': 'catsOpen.set(false)',
  },
  template: `
    <header class="header" [class.scrolled]="scrolled()">
      <div class="container header-row">
        <button type="button" class="icon-btn menu-btn" (click)="ui.menuOpen.set(true)" [attr.aria-label]="'a11y.menu' | t">
          <app-icon name="menu" [size]="22" />
        </button>

        <a class="logo" routerLink="/" [attr.aria-label]="storeName">
          <span class="logo-mark"><app-icon name="bag" [size]="18" [stroke]="2.4" /></span>
          <span class="logo-text">{{ storeName }}</span>
        </a>

        <nav class="nav" [attr.aria-label]="'a11y.mainNav' | t">
          <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ 'nav.home' | t }}</a>
          <a class="nav-link" routerLink="/shop" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ 'nav.shop' | t }}</a>

          <div class="nav-drop" (mouseenter)="catsOpen.set(true)" (mouseleave)="catsOpen.set(false)">
            <button type="button" class="nav-link nav-drop-btn" [attr.aria-expanded]="catsOpen()" aria-haspopup="true" (click)="catsOpen.update(v => !v)">
              {{ 'nav.categories' | t }} <app-icon name="chevron-down" [size]="14" />
            </button>
            @if (catsOpen()) {
              <div class="mega" role="menu">
                @for (c of categories(); track c.id) {
                  <a class="mega-item" role="menuitem" routerLink="/shop" [queryParams]="{ category: c.slug }" (click)="catsOpen.set(false)">
                    <span class="mega-icon" [style.--h]="c.hue"><app-icon [name]="c.glyph" [size]="20" /></span>
                    <span>{{ i18n.pick(c.name, c.nameAr) }}</span>
                  </a>
                }
              </div>
            }
          </div>

          <a class="nav-link nav-deals" routerLink="/shop" [queryParams]="{ sale: 'true' }">
            <app-icon name="percent" [size]="15" /> {{ 'nav.deals' | t }}
          </a>
        </nav>

        <app-search class="header-search" />

        <div class="header-actions">
          <button type="button" class="icon-btn" (click)="i18n.toggle()" [attr.aria-label]="'a11y.language' | t">
            <app-icon name="globe" [size]="20" /><span class="icon-btn-text">{{ i18n.lang() === 'en' ? 'عربي' : 'EN' }}</span>
          </button>
          <button type="button" class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="'a11y.theme' | t">
            <app-icon [name]="theme.mode() === 'dark' ? 'sun' : 'moon'" [size]="20" />
          </button>
          <a class="icon-btn hide-sm" routerLink="/wishlist" [attr.aria-label]="'nav.wishlist' | t">
            <app-icon name="heart" [size]="20" />
            @if (wishlist.count()) { <span class="count-badge">{{ wishlist.count() }}</span> }
          </a>
          <a class="icon-btn hide-sm" [routerLink]="auth.isLoggedIn() ? '/account' : '/login'" [attr.aria-label]="'nav.account' | t">
            <app-icon name="user" [size]="20" />
          </a>
          <button type="button" class="icon-btn cart-btn" (click)="ui.openCart()" [attr.aria-label]="'nav.cart' | t">
            <app-icon name="bag" [size]="21" />
            @if (cart.count()) { <span class="count-badge" [class.bump]="true">{{ cart.count() }}</span> }
          </button>
        </div>
      </div>
    </header>
  `,
})
export class Header {
  protected readonly ui = inject(Ui);
  protected readonly i18n = inject(I18n);
  protected readonly theme = inject(Theme);
  protected readonly cart = inject(Cart);
  protected readonly wishlist = inject(Wishlist);
  protected readonly auth = inject(Auth);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly storeName = environment.storeName;
  protected readonly scrolled = signal(false);
  protected readonly catsOpen = signal(false);
  protected readonly categories = toSignal(inject(ShopApi).categories(), { initialValue: [] });

  protected onScroll(): void {
    const s = window.scrollY > 8;
    if (s !== this.scrolled()) this.scrolled.set(s);
  }

  protected onDocClick(e: Event): void {
    if (!this.host.nativeElement.contains(e.target as Node)) this.catsOpen.set(false);
  }
}
