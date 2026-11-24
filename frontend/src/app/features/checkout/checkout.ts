import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { I18n, TPipe } from '../../core/i18n';
import { CartLine, PaymentProvider } from '../../core/models';
import { queryFrom } from '../../core/query';
import { ShopApi } from '../../core/shop-api';
import { Auth, Cart } from '../../core/stores';
import { Toasts } from '../../core/toast';
import { Art } from '../../shared/art';
import { FieldError } from '../../shared/field-error';
import { Icon } from '../../shared/icon';

const isCard = (c: AbstractControl) => c.parent?.get('method')?.value === 'Stripe';

const luhn: ValidatorFn = (c): ValidationErrors | null => {
  if (!isCard(c)) return null;
  const digits = String(c.value ?? '').replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return { card: true };
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0 ? null : { card: true };
};

const expiry: ValidatorFn = (c) => {
  if (!isCard(c)) return null;
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(String(c.value ?? ''));
  if (!m) return { expiry: true };
  const end = new Date(2000 + Number(m[2]), Number(m[1]), 1); // first day of the month after expiry
  return end.getTime() > Date.now() ? null : { expiry: true };
};

const cvc: ValidatorFn = (c) => (!isCard(c) || /^\d{3,4}$/.test(String(c.value ?? '')) ? null : { cvc: true });
const cardName: ValidatorFn = (c) => (!isCard(c) || String(c.value ?? '').trim() ? null : { required: true });
const phone: ValidatorFn = (c) => (/^[+\d][\d\s-]{6,17}$/.test(String(c.value ?? '')) ? null : { phone: true });

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, ReactiveFormsModule, Art, FieldError, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page">
      <div class="checkout-top">
        <a class="link-more" routerLink="/cart"><app-icon class="flip-rtl" name="arrow-left" [size]="16" /> {{ 'nav.cart' | t }}</a>
        <h1 class="page-title">{{ 'title.checkout' | t }}</h1>
        <span class="secure-note"><app-icon name="lock" [size]="15" /> {{ 'checkout.secure' | t }}</span>
      </div>

      <ol class="steps" [attr.aria-label]="'title.checkout' | t">
        @for (s of steps; track s; let i = $index) {
          <li [class.done]="i < step()" [class.current]="i === step()">
            <button type="button" [disabled]="i >= step()" (click)="step.set(i)">
              <span class="step-dot">@if (i < step()) { <app-icon name="check" [size]="14" [stroke]="3" /> } @else { {{ i + 1 }} }</span>
              <span class="step-label">{{ s | t }}</span>
            </button>
          </li>
        }
      </ol>

      <div class="checkout-layout">
        <div class="checkout-main">
          <!-- Step 1: details -->
          @if (step() === 0) {
            <form class="card form-card" [formGroup]="details" (ngSubmit)="next()" novalidate>
              <h2><app-icon name="user" [size]="20" /> {{ 'checkout.contact' | t }}</h2>
              <div class="form-grid">
                <div class="field span-2"><label for="email">{{ 'form.email' | t }}</label>
                  <input id="email" class="input" type="email" formControlName="email" autocomplete="email" inputmode="email" />
                  <app-field-error [control]="details.controls.email" /></div>
                <div class="field"><label for="fullName">{{ 'form.fullName' | t }}</label>
                  <input id="fullName" class="input" formControlName="fullName" autocomplete="name" />
                  <app-field-error [control]="details.controls.fullName" /></div>
                <div class="field"><label for="phone">{{ 'form.phone' | t }}</label>
                  <input id="phone" class="input" type="tel" formControlName="phone" autocomplete="tel" inputmode="tel" />
                  <app-field-error [control]="details.controls.phone" /></div>
              </div>

              <h2><app-icon name="pin" [size]="20" /> {{ 'checkout.address' | t }}</h2>
              <div class="form-grid">
                <div class="field span-2"><label for="line1">{{ 'form.line1' | t }}</label>
                  <input id="line1" class="input" formControlName="line1" autocomplete="address-line1" />
                  <app-field-error [control]="details.controls.line1" /></div>
                <div class="field"><label for="city">{{ 'form.city' | t }}</label>
                  <input id="city" class="input" formControlName="city" autocomplete="address-level2" />
                  <app-field-error [control]="details.controls.city" /></div>
                <div class="field"><label for="region">{{ 'form.region' | t }}</label>
                  <input id="region" class="input" formControlName="region" autocomplete="address-level1" />
                  <app-field-error [control]="details.controls.region" /></div>
                <div class="field"><label for="postal">{{ 'form.postal' | t }}</label>
                  <input id="postal" class="input" formControlName="postalCode" autocomplete="postal-code" />
                  <app-field-error [control]="details.controls.postalCode" /></div>
                <div class="field"><label for="country">{{ 'form.country' | t }}</label>
                  <select id="country" class="select" formControlName="country" autocomplete="country-name">
                    @for (c of countries; track c) { <option [value]="c">{{ c }}</option> }
                  </select></div>
              </div>
              <div class="form-actions"><button class="btn btn-primary btn-lg" type="submit">{{ 'cta.continue' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="18" /></button></div>
            </form>
          }

          <!-- Step 2: delivery -->
          @if (step() === 1) {
            <section class="card form-card">
              <h2><app-icon name="truck" [size]="20" /> {{ 'checkout.delivery' | t }}</h2>
              <div class="choice-list" role="radiogroup" [attr.aria-label]="'checkout.delivery' | t">
                @for (m of methods().data ?? []; track m.id) {
                  <label class="choice" [class.active]="shippingId() === m.id">
                    <input type="radio" name="ship" [checked]="shippingId() === m.id" (change)="shippingId.set(m.id)" />
                    <span class="choice-main">
                      <b>{{ i18n.pick(m.name, m.nameAr) }}</b>
                      <small>{{ i18n.pick(m.description, m.descriptionAr) }}</small>
                      <small class="muted">{{ 'checkout.eta' | t: { from: eta(m.minDays), to: eta(m.maxDays) } }}</small>
                    </span>
                    <span class="choice-price">
                      @if (costOf(m) === 0) { <b class="ok">{{ 'checkout.free' | t }}</b> } @else { <b>{{ i18n.money(costOf(m)) }}</b> }
                    </span>
                  </label>
                } @empty {
                  <div class="sk" style="height: 84px; border-radius: var(--r-md)"></div>
                  <div class="sk" style="height: 84px; border-radius: var(--r-md)"></div>
                }
              </div>
              <div class="form-actions between">
                <button class="btn btn-secondary" type="button" (click)="step.set(0)"><app-icon class="flip-rtl" name="arrow-left" [size]="16" /> {{ 'cta.back' | t }}</button>
                <button class="btn btn-primary btn-lg" type="button" [disabled]="!shippingId()" (click)="step.set(2)">{{ 'cta.continue' | t }} <app-icon class="flip-rtl" name="arrow-right" [size]="18" /></button>
              </div>
            </section>
          }

          <!-- Step 3: payment -->
          @if (step() === 2) {
            <form class="card form-card" [formGroup]="payment" (ngSubmit)="place()" novalidate>
              <h2><app-icon name="card" [size]="20" /> {{ 'checkout.payment' | t }}</h2>
              <div class="choice-list" role="radiogroup" [attr.aria-label]="'checkout.payment' | t">
                @for (o of paymentOptions; track o.id) {
                  <label class="choice" [class.active]="method() === o.id">
                    <input type="radio" name="pay" [checked]="method() === o.id" (change)="setMethod(o.id)" />
                    <span class="choice-icon"><app-icon [name]="o.icon" [size]="22" /></span>
                    <span class="choice-main"><b>{{ o.label | t }}</b><small>{{ o.hint | t }}</small></span>
                  </label>
                }
              </div>

              @if (method() === 'Stripe') {
                <div class="form-grid card-fields">
                  <div class="field span-2"><label for="cn">{{ 'form.cardName' | t }}</label>
                    <input id="cn" class="input" formControlName="cardName" autocomplete="cc-name" />
                    <app-field-error [control]="payment.controls.cardName" /></div>
                  <div class="field span-2"><label for="cc">{{ 'form.cardNumber' | t }}</label>
                    <input id="cc" class="input mono" formControlName="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23" (input)="formatCard($event)" />
                    <app-field-error [control]="payment.controls.cardNumber" /></div>
                  <div class="field"><label for="ce">{{ 'form.expiry' | t }}</label>
                    <input id="ce" class="input mono" formControlName="expiry" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" (input)="formatExpiry($event)" />
                    <app-field-error [control]="payment.controls.expiry" /></div>
                  <div class="field"><label for="cv">CVC</label>
                    <input id="cv" class="input mono" formControlName="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" />
                    <app-field-error [control]="payment.controls.cvc" /></div>
                </div>
                <p class="note"><app-icon name="info" [size]="15" /> {{ 'checkout.cardDemo' | t }}</p>
              } @else if (method() === 'PayPal') {
                <p class="note"><app-icon name="info" [size]="15" /> {{ 'checkout.paypalNote' | t }}</p>
              } @else {
                <p class="note"><app-icon name="info" [size]="15" /> {{ 'checkout.codNote' | t }}</p>
              }

              <div class="form-actions between">
                <button class="btn btn-secondary" type="button" (click)="step.set(1)"><app-icon class="flip-rtl" name="arrow-left" [size]="16" /> {{ 'cta.back' | t }}</button>
                <button class="btn btn-accent btn-lg" type="submit" [disabled]="placing()">
                  @if (placing()) { <span class="spinner" aria-hidden="true"></span> {{ 'checkout.placing' | t }} }
                  @else { <app-icon name="lock" [size]="18" /> {{ 'checkout.place' | t: { total: i18n.money(total()) } }} }
                </button>
              </div>
            </form>
          }
        </div>

        <!-- Order summary -->
        <aside class="summary card sticky">
          <h2>{{ 'cart.summary' | t }}</h2>
          <ul class="mini-lines">
            @for (l of cart.lines(); track l.key) {
              <li>
                <span class="mini-art"><app-art [hue]="l.hue" [glyph]="l.glyph" [tint]="l.colorHex ?? null" /><b class="mini-qty">{{ l.qty }}</b></span>
                <span class="mini-name">{{ i18n.pick(l.name, l.nameAr) }}<small class="muted">{{ variant(l) }}</small></span>
                <span>{{ i18n.money(l.price * l.qty) }}</span>
              </li>
            }
          </ul>
          <dl class="sum">
            <div><dt>{{ 'cart.subtotal' | t }}</dt><dd>{{ i18n.money(cart.subtotal()) }}</dd></div>
            @if (cart.discount() > 0) { <div class="disc"><dt>{{ 'cart.discount' | t }} @if (cart.coupon(); as c) { <small>({{ c.code }})</small> }</dt><dd>-{{ i18n.money(cart.discount()) }}</dd></div> }
            <div><dt>{{ 'cart.shipping' | t }}</dt><dd>@if (step() === 0 || !selectedMethod()) { <span class="muted">—</span> } @else if (shipping() === 0) { <b class="ok">{{ 'checkout.free' | t }}</b> } @else { {{ i18n.money(shipping()) }} }</dd></div>
            <div class="total"><dt>{{ 'cart.total' | t }}</dt><dd>{{ i18n.money(total()) }}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  `,
})
export class Checkout {
  protected readonly i18n = inject(I18n);
  protected readonly cart = inject(Cart);
  private readonly api = inject(ShopApi);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toasts = inject(Toasts);

  protected readonly steps = ['checkout.contact', 'checkout.delivery', 'checkout.payment'];
  protected readonly step = signal(0);
  protected readonly placing = signal(false);
  protected readonly countries = ['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Jordan', 'United Kingdom', 'United States', 'Germany'];

  protected readonly details = new FormGroup({
    email: new FormControl(this.auth.user()?.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    fullName: new FormControl(this.auth.user()?.name ?? '', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, phone] }),
    line1: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    region: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('Egypt', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly payment = new FormGroup({
    method: new FormControl<PaymentProvider>('CashOnDelivery', { nonNullable: true }),
    cardName: new FormControl('', { nonNullable: true, validators: [cardName] }),
    cardNumber: new FormControl('', { nonNullable: true, validators: [luhn] }),
    expiry: new FormControl('', { nonNullable: true, validators: [expiry] }),
    cvc: new FormControl('', { nonNullable: true, validators: [cvc] }),
  });
  protected readonly method = toSignal(this.payment.controls.method.valueChanges, { initialValue: this.payment.controls.method.value });
  protected readonly paymentOptions: { id: PaymentProvider; icon: string; label: string; hint: string }[] = [
    { id: 'CashOnDelivery', icon: 'cash', label: 'pay.cod', hint: 'pay.codHint' },
    { id: 'Stripe', icon: 'card', label: 'pay.card', hint: 'pay.cardHint' },
    { id: 'PayPal', icon: 'globe', label: 'pay.paypal', hint: 'pay.paypalHint' },
  ];

  protected readonly methods = queryFrom(() => 'ship', () => this.api.shippingMethods());
  protected readonly shippingId = signal<number | null>(null);
  protected readonly selectedMethod = computed(() => (this.methods().data ?? []).find((m) => m.id === this.shippingId()) ?? null);

  protected readonly shipping = computed(() => {
    const m = this.selectedMethod();
    return m ? this.costOf(m) : 0;
  });
  protected readonly total = computed(() => Math.max(0, this.cart.subtotal() - this.cart.discount() + this.shipping()));

  constructor() {
    // Preselect the first delivery option once the list has loaded.
    effect(() => {
      const list = this.methods().data;
      if (list?.length && this.shippingId() === null) this.shippingId.set(list[0].id);
    });
  }

  protected variant(l: CartLine): string {
    return [this.i18n.pick(l.color, l.colorAr), l.size].filter(Boolean).join(' · ');
  }

  protected costOf(m: { cost: number; freeAbove?: number }): number {
    const free = this.cart.coupon()?.type === 'FreeShipping' || (m.freeAbove !== undefined && this.cart.subtotal() >= m.freeAbove);
    return free ? 0 : m.cost;
  }

  protected eta(days: number): string {
    return this.i18n.date(new Date(Date.now() + days * 86_400_000), { day: 'numeric', month: 'short' });
  }

  protected setMethod(m: PaymentProvider): void {
    this.payment.controls.method.setValue(m);
    for (const c of ['cardName', 'cardNumber', 'expiry', 'cvc'] as const) this.payment.controls[c].updateValueAndValidity();
  }

  protected formatCard(e: Event): void {
    const el = e.target as HTMLInputElement;
    const v = el.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
    el.value = v;
    this.payment.controls.cardNumber.setValue(v);
  }

  protected formatExpiry(e: Event): void {
    const el = e.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    el.value = v;
    this.payment.controls.expiry.setValue(v);
  }

  protected next(): void {
    if (this.details.invalid) {
      this.details.markAllAsTouched();
      queueMicrotask(() => document.querySelector<HTMLElement>('.input.ng-invalid')?.focus());
      return;
    }
    this.step.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected place(): void {
    if (this.payment.invalid) {
      this.payment.markAllAsTouched();
      return;
    }
    const m = this.selectedMethod();
    if (!m || this.placing() || !this.cart.lines().length) return;
    const d = this.details.getRawValue();
    this.placing.set(true);
    this.api
      .placeOrder({
        email: d.email,
        address: { fullName: d.fullName, phone: d.phone, line1: d.line1, city: d.city, region: d.region, postalCode: d.postalCode, country: d.country },
        shippingMethodId: m.id,
        payment: this.payment.controls.method.value,
        couponCode: this.cart.coupon()?.code,
        lines: this.cart.lines().map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          void this.router.navigate(['/checkout/success', order.number]);
        },
        error: () => {
          this.placing.set(false);
          this.toasts.error(this.i18n.t('checkout.failed'));
        },
      });
  }
}
