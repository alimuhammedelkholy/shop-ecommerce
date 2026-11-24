import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';
import { I18n, TPipe } from '../core/i18n';
import { ShopApi } from '../core/shop-api';
import { Toasts } from '../core/toast';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, ReactiveFormsModule, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container">
        <section class="newsletter">
          <div>
            <h2>{{ 'news.title' | t }}</h2>
            <p>{{ 'news.text' | t }}</p>
          </div>
          <form class="newsletter-form" (submit)="subscribe($event)" novalidate>
            <div class="newsletter-field">
              <app-icon name="mail" [size]="18" />
              <input type="email" [formControl]="email" [placeholder]="'news.placeholder' | t" [attr.aria-label]="'news.placeholder' | t" autocomplete="email" />
            </div>
            <button class="btn btn-accent" type="submit" [disabled]="busy()">{{ 'news.cta' | t }}</button>
            @if (email.touched && email.invalid) { <small class="field-error">{{ 'form.email' | t }}</small> }
          </form>
        </section>

        <div class="footer-grid">
          <div class="footer-brand">
            <a class="logo" routerLink="/"><span class="logo-mark"><app-icon name="bag" [size]="18" [stroke]="2.4" /></span><span class="logo-text">{{ storeName }}</span></a>
            <p>{{ 'footer.about' | t }}</p>
          </div>
          <nav>
            <h3>{{ 'footer.shop' | t }}</h3>
            @for (c of categories().slice(0, 5); track c.id) {
              <a routerLink="/shop" [queryParams]="{ category: c.slug }">{{ i18n.pick(c.name, c.nameAr) }}</a>
            }
          </nav>
          <nav>
            <h3>{{ 'footer.help' | t }}</h3>
            <a routerLink="/account">{{ 'footer.orders' | t }}</a>
            <a routerLink="/wishlist">{{ 'nav.wishlist' | t }}</a>
            <a routerLink="/cart">{{ 'nav.cart' | t }}</a>
            <a routerLink="/login">{{ 'nav.signin' | t }}</a>
          </nav>
          <div>
            <h3>{{ 'footer.pay' | t }}</h3>
            <div class="pay-chips"><span>{{ 'pay.cod' | t }}</span><span>Visa</span><span>Mastercard</span><span>PayPal</span></div>
            <p class="muted small">{{ 'footer.secure' | t }}</p>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© {{ year }} {{ storeName }}. {{ 'footer.rights' | t }}</span>
          <span class="footer-demo">{{ 'footer.demo' | t }}</span>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly i18n = inject(I18n);
  private readonly api = inject(ShopApi);
  private readonly toasts = inject(Toasts);
  protected readonly storeName = environment.storeName;
  protected readonly year = new Date().getFullYear();
  protected readonly categories = toSignal(this.api.categories(), { initialValue: [] });
  protected readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  protected readonly busy = signal(false);

  protected subscribe(e: Event): void {
    e.preventDefault();
    this.email.markAsTouched();
    if (this.email.invalid) return;
    this.busy.set(true);
    this.api.subscribeNewsletter(this.email.value).subscribe({
      next: () => {
        this.toasts.success(this.i18n.t('news.done'));
        this.email.reset('');
        this.busy.set(false);
      },
      error: () => {
        this.toasts.error(this.i18n.t('error.generic'));
        this.busy.set(false);
      },
    });
  }
}
