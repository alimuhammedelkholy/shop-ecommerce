import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet,
} from '@angular/router';
import { environment } from '../environments/environment';
import { I18n, TPipe } from './core/i18n';
import { Theme } from './core/theme';
import { Ui } from './core/ui';
import { BottomNav } from './layout/bottom-nav';
import { CartDrawer } from './layout/cart-drawer';
import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { MobileMenu } from './layout/mobile-menu';
import { Icon } from './shared/icon';
import { ToastHost } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, CartDrawer, MobileMenu, BottomNav, ToastHost, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main" (click)="focusMain($event)">{{ 'a11y.skip' | t }}</a>

    @if (navigating()) { <div class="route-progress" aria-hidden="true"></div> }

    @if (ui.announcementOpen()) {
      <div class="announce">
        <div class="container announce-row">
          <span><app-icon name="truck" [size]="16" /> {{ 'announce.text' | t: { amount: i18n.money(freeShip) } }}
            <b class="announce-code">WELCOME10</b></span>
          <button type="button" class="announce-close" (click)="ui.announcementOpen.set(false)" [attr.aria-label]="'a11y.close' | t">
            <app-icon name="close" [size]="14" />
          </button>
        </div>
      </div>
    }

    <app-header />
    <main id="main" tabindex="-1"><router-outlet /></main>
    <app-footer />

    <app-cart-drawer />
    <app-mobile-menu />
    <app-bottom-nav />
    <app-toasts />
  `,
})
export class App {
  protected readonly ui = inject(Ui);
  protected readonly i18n = inject(I18n);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  protected readonly freeShip = environment.freeShippingThreshold;
  protected readonly navigating = signal(false);

  constructor() {
    inject(Theme); // apply the saved theme immediately

    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof NavigationStart) this.navigating.set(true);
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        this.navigating.set(false);
        this.ui.closeAll();
      }
    });

    // Lock page scroll while a drawer is open.
    effect(() => {
      this.doc.body.classList.toggle('no-scroll', this.ui.cartOpen() || this.ui.menuOpen());
    });
  }

  protected focusMain(e: Event): void {
    e.preventDefault();
    this.doc.getElementById('main')?.focus();
  }
}
