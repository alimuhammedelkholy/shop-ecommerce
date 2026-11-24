import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Art } from '../../shared/art';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-order-success',
  imports: [RouterLink, Art, EmptyState, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page narrow">
      @if (order(); as o) {
        <div class="success">
          <div class="success-burst" aria-hidden="true">
            @for (i of dots; track i) { <i [style.--i]="i"></i> }
            <span class="success-check"><app-icon name="check" [size]="40" [stroke]="3" /></span>
          </div>
          <h1>{{ 'success.title' | t }}</h1>
          <p class="muted">{{ 'success.text' | t: { email: o.email } }}</p>

          <div class="card success-card">
            <div class="success-meta">
              <div><small>{{ 'order.number' | t }}</small><b>{{ o.number }}</b></div>
              <div><small>{{ 'order.date' | t }}</small><b>{{ i18n.date(o.createdAt) }}</b></div>
              <div><small>{{ 'order.total' | t }}</small><b>{{ i18n.money(o.total) }}</b></div>
              <div><small>{{ 'order.payment' | t }}</small><b>{{ 'pay.' + paymentKey() | t }}</b></div>
            </div>
            <ul class="mini-lines">
              @for (l of o.lines; track l.productId + l.variantLabel) {
                <li>
                  <span class="mini-art"><app-art [hue]="l.hue" [glyph]="l.glyph" /><b class="mini-qty">{{ l.qty }}</b></span>
                  <span class="mini-name">{{ i18n.pick(l.name, l.nameAr) }}<small class="muted">{{ l.variantLabel }}</small></span>
                  <span>{{ i18n.money(l.price * l.qty) }}</span>
                </li>
              }
            </ul>
            <p class="deliver-to"><app-icon name="pin" [size]="16" /> {{ o.address.fullName }} · {{ o.address.line1 }}, {{ o.address.city }}</p>
          </div>

          <div class="success-actions">
            <a class="btn btn-primary btn-lg" [routerLink]="['/orders', o.number]"><app-icon name="package" [size]="18" /> {{ 'order.track' | t }}</a>
            <a class="btn btn-secondary btn-lg" routerLink="/shop">{{ 'cart.continue' | t }}</a>
          </div>
        </div>
      } @else if (state().status === 'error') {
        <app-empty icon="package" [title]="'error.notFound' | t">
          <a class="btn btn-primary" routerLink="/shop">{{ 'cta.startShopping' | t }}</a>
        </app-empty>
      } @else {
        <div class="sk" style="height: 420px; border-radius: var(--r-xl)"></div>
      }
    </div>
  `,
})
export class OrderSuccess {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  readonly orderNo = input.required<string>();
  protected readonly dots = Array.from({ length: 14 }, (_, i) => i);
  protected readonly state = queryFrom(() => this.orderNo(), (n) => this.api.order(n));
  protected readonly order = computed(() => (this.state().status === 'ready' ? this.state().data : null));
  protected readonly paymentKey = computed(() => {
    const p = this.order()?.payment;
    return p === 'Stripe' ? 'card' : p === 'PayPal' ? 'paypal' : 'cod';
  });
}
