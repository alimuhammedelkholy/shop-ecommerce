import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TPipe } from '../core/i18n';
import { Auth, Cart, Wishlist } from '../core/stores';
import { Ui } from '../core/ui';
import { Icon } from '../shared/icon';

/** Thumb-reachable navigation bar shown on phones only. */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bottom-nav" [attr.aria-label]="'a11y.mainNav' | t">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><app-icon name="home" [size]="22" /><span>{{ 'nav.home' | t }}</span></a>
      <a routerLink="/shop" routerLinkActive="active"><app-icon name="store" [size]="22" /><span>{{ 'nav.shop' | t }}</span></a>
      <a routerLink="/wishlist" routerLinkActive="active">
        <app-icon name="heart" [size]="22" />
        @if (wishlist.count()) { <b class="count-badge">{{ wishlist.count() }}</b> }
        <span>{{ 'nav.wishlist' | t }}</span>
      </a>
      <button type="button" (click)="ui.openCart()">
        <app-icon name="bag" [size]="22" />
        @if (cart.count()) { <b class="count-badge">{{ cart.count() }}</b> }
        <span>{{ 'nav.cart' | t }}</span>
      </button>
      <a [routerLink]="auth.isLoggedIn() ? '/account' : '/login'" routerLinkActive="active"><app-icon name="user" [size]="22" /><span>{{ 'nav.account' | t }}</span></a>
    </nav>
  `,
})
export class BottomNav {
  protected readonly ui = inject(Ui);
  protected readonly cart = inject(Cart);
  protected readonly wishlist = inject(Wishlist);
  protected readonly auth = inject(Auth);
}
