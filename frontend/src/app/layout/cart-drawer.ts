import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { I18n, TPipe } from '../core/i18n';
import { CartLine } from '../core/models';
import { Cart } from '../core/stores';
import { Toasts } from '../core/toast';
import { Ui } from '../core/ui';
import { Art } from '../shared/art';
import { Icon } from '../shared/icon';
import { Stepper } from '../shared/stepper';

@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, Icon, Art, Stepper, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'ui.cartOpen.set(false)' },
  template: `
    @if (ui.cartOpen()) {
      <div class="overlay" (click)="ui.cartOpen.set(false)"></div>
      <aside class="drawer drawer-end" role="dialog" aria-modal="true" [attr.aria-label]="'nav.cart' | t">
        <div class="drawer-head">
          <h2>{{ 'cart.title' | t }} <span class="muted">({{ i18n.num(cart.count()) }})</span></h2>
          <button #closeBtn type="button" class="icon-btn" (click)="ui.cartOpen.set(false)" [attr.aria-label]="'a11y.close' | t">
            <app-icon name="close" [size]="20" />
          </button>
        </div>

        @if (cart.lines().length) {
          <div class="ship-progress">
            @if (cart.freeShippingLeft() > 0) {
              <p>{{ 'cart.freeShipLeft' | t: { amount: i18n.money(cart.freeShippingLeft()) } }}</p>
            } @else {
              <p class="ok"><app-icon name="check" [size]="14" /> {{ 'cart.freeShipUnlocked' | t }}</p>
            }
            <div class="progress"><span [style.width.%]="cart.freeShippingProgress()"></span></div>
          </div>

          <ul class="drawer-body line-list">
            @for (l of cart.lines(); track l.key) {
              <li class="line">
                <a class="line-art" [routerLink]="['/product', l.slug]"><app-art [hue]="l.hue" [glyph]="l.glyph" [tint]="l.colorHex ?? null" /></a>
                <div class="line-info">
                  <a class="line-name" [routerLink]="['/product', l.slug]">{{ i18n.pick(l.name, l.nameAr) }}</a>
                  <span class="line-variant">{{ variant(l) }}</span>
                  <div class="line-row">
                    <app-stepper [value]="l.qty" (valueChange)="cart.setQty(l.key, $event)" [max]="l.maxQty" />
                    <strong>{{ i18n.money(l.price * l.qty) }}</strong>
                  </div>
                </div>
                <button type="button" class="icon-btn line-remove" (click)="remove(l)" [attr.aria-label]="'cart.remove' | t">
                  <app-icon name="trash" [size]="17" />
                </button>
              </li>
            }
          </ul>

          <div class="drawer-foot">
            <div class="sum-row"><span>{{ 'cart.subtotal' | t }}</span><strong>{{ i18n.money(cart.subtotal()) }}</strong></div>
            <p class="muted small">{{ 'cart.taxNote' | t }}</p>
            <a class="btn btn-primary btn-lg btn-block" routerLink="/checkout">{{ 'cta.checkout' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="18" /></a>
            <a class="btn btn-secondary btn-block" routerLink="/cart">{{ 'cta.viewCart' | t }}</a>
          </div>
        } @else {
          <div class="drawer-empty">
            <div class="empty-icon"><app-icon name="bag" [size]="34" [stroke]="1.5" /></div>
            <h3>{{ 'cart.empty' | t }}</h3>
            <p class="muted">{{ 'cart.emptyText' | t }}</p>
            <a class="btn btn-primary" routerLink="/shop">{{ 'cta.startShopping' | t }}</a>
          </div>
        }
      </aside>
    }
  `,
})
export class CartDrawer {
  protected readonly ui = inject(Ui);
  protected readonly cart = inject(Cart);
  protected readonly i18n = inject(I18n);
  private readonly toasts = inject(Toasts);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  protected readonly free = environment.freeShippingThreshold;

  constructor() {
    // Move focus into the dialog when it opens.
    effect(() => this.closeBtn()?.nativeElement.focus());
  }

  protected variant(l: CartLine): string {
    return [this.i18n.pick(l.color, l.colorAr), l.size].filter(Boolean).join(' · ');
  }

  protected remove(l: CartLine): void {
    const removed = this.cart.remove(l.key);
    if (!removed) return;
    this.toasts.success(this.i18n.t('cart.removed'), {
      label: this.i18n.t('cta.undo'),
      run: () => this.cart.restore(removed.line, removed.index),
    });
  }
}
