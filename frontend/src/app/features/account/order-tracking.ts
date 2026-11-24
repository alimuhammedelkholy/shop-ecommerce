import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { OrderStatus } from '../../core/models';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Art } from '../../shared/art';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';

const FLOW: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
const ICONS: Record<string, string> = { Pending: 'clock', Confirmed: 'check', Processing: 'package', Shipped: 'truck', Delivered: 'home' };

@Component({
  selector: 'app-order-tracking',
  imports: [RouterLink, Art, Breadcrumbs, EmptyState, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      @if (order(); as o) {
        <app-breadcrumbs [items]="[{ label: ('nav.account' | t), link: '/account' }, { label: o.number }]" />
        <div class="page-head">
          <div><h1>{{ 'order.title' | t }} {{ o.number }}</h1><p class="muted">{{ 'order.placed' | t }} {{ i18n.date(o.createdAt, { dateStyle: 'long' }) }}</p></div>
          <span class="status lg" [attr.data-status]="o.status">{{ 'status.' + o.status | t }}</span>
        </div>

        @if (off()) {
          <div class="banner warn"><app-icon name="alert" [size]="18" /> {{ 'status.' + o.status | t }}</div>
        } @else {
          <ol class="timeline" [attr.aria-label]="'order.track' | t">
            @for (s of flow; track s; let i = $index) {
              <li [class.done]="i < index()" [class.current]="i === index()">
                <span class="tl-dot"><app-icon [name]="icons[s]" [size]="18" /></span>
                <b>{{ 'status.' + s | t }}</b>
                <small class="muted">{{ i <= index() ? stamp(o.createdAt, i) : '' }}</small>
              </li>
            }
          </ol>
        }

        <div class="cart-layout">
          <section class="card form-card">
            <h2>{{ 'order.items' | t }}</h2>
            <ul class="mini-lines big">
              @for (l of o.lines; track l.productId + l.variantLabel) {
                <li>
                  <a class="mini-art" [routerLink]="['/product', l.slug]"><app-art [hue]="l.hue" [glyph]="l.glyph" /><b class="mini-qty">{{ l.qty }}</b></a>
                  <span class="mini-name"><a [routerLink]="['/product', l.slug]">{{ i18n.pick(l.name, l.nameAr) }}</a><small class="muted">{{ l.variantLabel }}</small></span>
                  <span>{{ i18n.money(l.price * l.qty) }}</span>
                </li>
              }
            </ul>
          </section>
          <aside class="summary card">
            <h2>{{ 'cart.summary' | t }}</h2>
            <dl class="sum">
              <div><dt>{{ 'cart.subtotal' | t }}</dt><dd>{{ i18n.money(o.subtotal) }}</dd></div>
              @if (o.discount > 0) { <div class="disc"><dt>{{ 'cart.discount' | t }}</dt><dd>-{{ i18n.money(o.discount) }}</dd></div> }
              <div><dt>{{ 'cart.shipping' | t }}</dt><dd>{{ o.shipping === 0 ? ('checkout.free' | t) : i18n.money(o.shipping) }}</dd></div>
              <div class="total"><dt>{{ 'cart.total' | t }}</dt><dd>{{ i18n.money(o.total) }}</dd></div>
            </dl>
            <h3>{{ 'checkout.address' | t }}</h3>
            <address class="addr">{{ o.address.fullName }}<br />{{ o.address.line1 }}<br />{{ o.address.city }}, {{ o.address.region }} {{ o.address.postalCode }}<br />{{ o.address.country }}<br />{{ o.address.phone }}</address>
            <h3>{{ 'checkout.delivery' | t }}</h3>
            <p>{{ i18n.pick(o.shippingMethod, o.shippingMethodAr) }}</p>
          </aside>
        </div>
      } @else if (state().status === 'error') {
        <app-empty icon="package" [title]="'error.notFound' | t"><a class="btn btn-primary" routerLink="/account">{{ 'account.orders' | t }}</a></app-empty>
      } @else {
        <div class="sk" style="height: 320px; border-radius: var(--r-xl)"></div>
      }
    </div>
  `,
})
export class OrderTracking {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  /** Bound from the route: /orders/:number */
  readonly number = input.required<string>();
  protected readonly flow = FLOW;
  protected readonly icons = ICONS;
  protected readonly state = queryFrom(() => this.number(), (n) => this.api.order(n));
  protected readonly order = computed(() => (this.state().status === 'ready' ? this.state().data : null));
  protected readonly index = computed(() => FLOW.indexOf(this.order()?.status ?? 'Pending'));
  protected readonly off = computed(() => this.index() === -1);

  /** The demo has no status history, so each step gets a plausible timestamp. */
  protected stamp(created: string, step: number): string {
    return this.i18n.date(new Date(new Date(created).getTime() + step * 0.8 * 86_400_000), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }
}
