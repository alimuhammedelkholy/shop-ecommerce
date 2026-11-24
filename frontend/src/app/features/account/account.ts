import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Auth } from '../../core/stores';
import { Theme } from '../../core/theme';
import { Art } from '../../shared/art';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';

type Tab = 'orders' | 'profile';

@Component({
  selector: 'app-account',
  imports: [RouterLink, Art, EmptyState, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      @if (auth.user(); as u) {
        <header class="account-head card">
          <span class="avatar xl">{{ u.name.charAt(0) }}</span>
          <div class="grow"><h1>{{ 'account.hello' | t: { name: u.name } }}</h1><p class="muted">{{ u.email }}</p></div>
          <button type="button" class="btn btn-secondary" (click)="logout()"><app-icon name="logout" [size]="17" /> {{ 'account.logout' | t }}</button>
        </header>

        <div class="tabs tabs-line" role="tablist">
          <button type="button" class="tab" role="tab" [class.active]="tab() === 'orders'" [attr.aria-selected]="tab() === 'orders'" (click)="tab.set('orders')">{{ 'account.orders' | t }}</button>
          <button type="button" class="tab" role="tab" [class.active]="tab() === 'profile'" [attr.aria-selected]="tab() === 'profile'" (click)="tab.set('profile')">{{ 'account.profile' | t }}</button>
        </div>

        @if (tab() === 'orders') {
          @if (orders().data; as list) {
            @if (list.length) {
              <ul class="order-list">
                @for (o of list; track o.id) {
                  <li class="card order-card">
                    <div class="order-top">
                      <div><b>{{ o.number }}</b><small class="muted">{{ i18n.date(o.createdAt) }}</small></div>
                      <span class="status" [attr.data-status]="o.status">{{ 'status.' + o.status | t }}</span>
                      <b class="order-total">{{ i18n.money(o.total) }}</b>
                    </div>
                    <div class="order-items">
                      @for (l of o.lines.slice(0, 4); track l.productId) {
                        <span class="mini-art"><app-art [hue]="l.hue" [glyph]="l.glyph" /></span>
                      }
                      <span class="muted small">{{ 'cart.items' | t: { n: i18n.num(count(o.lines)) } }}</span>
                      <a class="btn btn-soft btn-sm push" [routerLink]="['/orders', o.number]">{{ 'order.track' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="15" /></a>
                    </div>
                  </li>
                }
              </ul>
            } @else {
              <app-empty icon="package" [title]="'account.noOrders' | t"><a class="btn btn-primary" routerLink="/shop">{{ 'cta.startShopping' | t }}</a></app-empty>
            }
          } @else {
            <div class="sk" style="height: 120px; border-radius: var(--r-lg)"></div>
          }
        } @else {
          <section class="card form-card prefs">
            <h2>{{ 'account.preferences' | t }}</h2>
            <div class="pref-row"><span><b>{{ 'a11y.language' | t }}</b><small class="muted">{{ i18n.lang() === 'en' ? 'English' : 'العربية' }}</small></span>
              <button type="button" class="btn btn-secondary" (click)="i18n.toggle()"><app-icon name="globe" [size]="17" /> {{ i18n.lang() === 'en' ? 'العربية' : 'English' }}</button></div>
            <div class="pref-row"><span><b>{{ 'a11y.theme' | t }}</b><small class="muted">{{ (theme.mode() === 'dark' ? 'theme.dark' : 'theme.light') | t }}</small></span>
              <button type="button" class="btn btn-secondary" (click)="theme.toggle()"><app-icon [name]="theme.mode() === 'dark' ? 'sun' : 'moon'" [size]="17" /> {{ (theme.mode() === 'dark' ? 'theme.light' : 'theme.dark') | t }}</button></div>
          </section>
        }
      }
    </div>
  `,
})
export class Account {
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);
  protected readonly theme = inject(Theme);
  private readonly router = inject(Router);
  private readonly api = inject(ShopApi);
  protected readonly tab = signal<Tab>('orders');
  protected readonly orders = queryFrom(() => 'orders', () => this.api.orders());

  protected count(lines: { qty: number }[]): number {
    return lines.reduce((n, l) => n + l.qty, 0);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
