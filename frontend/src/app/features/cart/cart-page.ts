import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { I18n, TPipe } from '../../core/i18n';
import { CartLine } from '../../core/models';
import { ApiError, ShopApi } from '../../core/shop-api';
import { Cart } from '../../core/stores';
import { Toasts } from '../../core/toast';
import { Art } from '../../shared/art';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { Stepper } from '../../shared/stepper';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, ReactiveFormsModule, Art, Breadcrumbs, EmptyState, Icon, Stepper, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <app-breadcrumbs [items]="[{ label: ('nav.home' | t), link: '/' }, { label: ('cart.title' | t) }]" />
      <h1 class="page-title">{{ 'cart.title' | t }} @if (cart.count()) { <span class="muted">({{ 'cart.items' | t: { n: i18n.num(cart.count()) } }})</span> }</h1>

      @if (cart.lines().length) {
        <div class="cart-layout">
          <section>
            <div class="card ship-card">
              @if (cart.freeShippingLeft() > 0) {
                <p><app-icon name="truck" [size]="18" /> {{ 'cart.freeShipLeft' | t: { amount: i18n.money(cart.freeShippingLeft()) } }}</p>
              } @else {
                <p class="ok"><app-icon name="check" [size]="18" /> {{ 'cart.freeShipUnlocked' | t }}</p>
              }
              <div class="progress"><span [style.width.%]="cart.freeShippingProgress()"></span></div>
            </div>

            <ul class="cart-lines">
              @for (l of cart.lines(); track l.key) {
                <li class="cart-line card">
                  <a class="line-art lg" [routerLink]="['/product', l.slug]"><app-art [hue]="l.hue" [glyph]="l.glyph" [tint]="l.colorHex ?? null" /></a>
                  <div class="cart-line-info">
                    <a class="line-name" [routerLink]="['/product', l.slug]">{{ i18n.pick(l.name, l.nameAr) }}</a>
                    <span class="line-variant">{{ variant(l) }}</span>
                    <span class="price-now">{{ i18n.money(l.price) }}
                      @if (l.compareAt && l.compareAt > l.price) { <s class="price-old">{{ i18n.money(l.compareAt) }}</s> }</span>
                  </div>
                  <app-stepper [value]="l.qty" (valueChange)="cart.setQty(l.key, $event)" [max]="l.maxQty" />
                  <strong class="cart-line-total">{{ i18n.money(l.price * l.qty) }}</strong>
                  <button type="button" class="icon-btn danger" (click)="remove(l)" [attr.aria-label]="'cart.remove' | t"><app-icon name="trash" [size]="18" /></button>
                </li>
              }
            </ul>
            <a class="link-more" routerLink="/shop"><app-icon class="flip-rtl" name="arrow-left" [size]="16" /> {{ 'cart.continue' | t }}</a>
          </section>

          <aside class="summary card">
            <h2>{{ 'cart.summary' | t }}</h2>

            @if (cart.coupon(); as c) {
              <div class="coupon-applied">
                <span><app-icon name="tag" [size]="16" /> <b>{{ c.code }}</b> <small>{{ couponText(c.code) }}</small></span>
                <button type="button" class="icon-btn sm" (click)="removeCoupon()" [attr.aria-label]="'cart.removeCoupon' | t"><app-icon name="close" [size]="14" /></button>
              </div>
            } @else {
              <form class="coupon" (submit)="applyCoupon($event)">
                <input class="input" [formControl]="code" [placeholder]="'cart.coupon' | t" [attr.aria-label]="'cart.coupon' | t" autocomplete="off" />
                <button class="btn btn-soft" type="submit" [disabled]="applying() || !code.value.trim()">{{ 'cart.apply' | t }}</button>
              </form>
              <p class="muted small">{{ 'cart.try' | t }}
                @for (c of samples; track c) { <button type="button" class="chip" (click)="useSample(c)">{{ c }}</button> }</p>
            }

            <dl class="sum">
              <div><dt>{{ 'cart.subtotal' | t }}</dt><dd>{{ i18n.money(cart.subtotal()) }}</dd></div>
              @if (cart.discount() > 0) { <div class="disc"><dt>{{ 'cart.discount' | t }}</dt><dd>-{{ i18n.money(cart.discount()) }}</dd></div> }
              <div><dt>{{ 'cart.shipping' | t }}</dt><dd class="muted">{{ 'cart.atCheckout' | t }}</dd></div>
              <div class="total"><dt>{{ 'cart.total' | t }}</dt><dd>{{ i18n.money(cart.subtotal() - cart.discount()) }}</dd></div>
            </dl>
            <a class="btn btn-primary btn-lg btn-block" routerLink="/checkout"><app-icon name="lock" [size]="18" /> {{ 'cta.checkout' | t }}</a>
            <p class="secure-note"><app-icon name="shield" [size]="15" /> {{ 'footer.secure' | t }}</p>
          </aside>
        </div>
      } @else {
        <app-empty icon="bag" [title]="'cart.empty' | t" [text]="'cart.emptyText' | t">
          <a class="btn btn-primary btn-lg" routerLink="/shop">{{ 'cta.startShopping' | t }}</a>
        </app-empty>
      }
    </div>
  `,
})
export class CartPage {
  protected readonly cart = inject(Cart);
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  private readonly toasts = inject(Toasts);

  protected readonly code = new FormControl('', { nonNullable: true });
  protected readonly applying = signal(false);
  protected readonly samples = ['WELCOME10', 'SAVE20', 'FREESHIP'];
  protected readonly free = environment.freeShippingThreshold;

  protected variant(l: CartLine): string {
    return [this.i18n.pick(l.color, l.colorAr), l.size].filter(Boolean).join(' · ');
  }

  protected couponText(code: string): string {
    const key = 'coupon.' + code;
    const translated = this.i18n.t(key);
    return translated === key ? (this.cart.coupon()?.description ?? '') : translated;
  }

  protected useSample(code: string): void {
    this.code.setValue(code);
    this.applyCoupon();
  }

  protected applyCoupon(e?: Event): void {
    e?.preventDefault();
    const value = this.code.value.trim();
    if (!value) return;
    this.applying.set(true);
    this.api.validateCoupon(value, this.cart.subtotal()).subscribe({
      next: (coupon) => {
        this.cart.coupon.set(coupon);
        this.code.reset('');
        this.applying.set(false);
        this.toasts.success(this.i18n.t('cart.couponApplied'));
      },
      error: (e: unknown) => {
        this.applying.set(false);
        this.toasts.error(e instanceof ApiError ? this.i18n.t(e.code, e.params && { min: this.i18n.money(Number(e.params['min'])) }) : this.i18n.t('error.generic'));
      },
    });
  }

  protected removeCoupon(): void {
    this.cart.coupon.set(null);
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
