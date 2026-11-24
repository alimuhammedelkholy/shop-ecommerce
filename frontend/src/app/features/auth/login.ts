import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { I18n, TPipe } from '../../core/i18n';
import { ApiError } from '../../core/shop-api';
import { Auth } from '../../core/stores';
import { Toasts } from '../../core/toast';
import { FieldError } from '../../shared/field-error';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, FieldError, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <div class="auth-side" aria-hidden="true">
        <div class="auth-side-inner">
          <span class="logo-mark big"><app-icon name="bag" [size]="30" [stroke]="2.2" /></span>
          <h2>{{ 'auth.sideTitle' | t }}</h2>
          <ul>
            <li><app-icon name="truck" [size]="18" /> {{ 'trust.shipText' | t }}</li>
            <li><app-icon name="undo" [size]="18" /> {{ 'trust.returnsText' | t }}</li>
            <li><app-icon name="heart" [size]="18" /> {{ 'auth.perk3' | t }}</li>
          </ul>
        </div>
      </div>

      <div class="auth-main">
        <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <h1>{{ (mode() === 'login' ? 'auth.welcome' : 'auth.create') | t }}</h1>
          <p class="muted">{{ (mode() === 'login' ? 'auth.welcomeText' : 'auth.createText') | t }}</p>

          <div class="tabs tabs-pill" role="tablist">
            <button type="button" class="tab" role="tab" [class.active]="mode() === 'login'" [attr.aria-selected]="mode() === 'login'" (click)="setMode('login')">{{ 'nav.signin' | t }}</button>
            <button type="button" class="tab" role="tab" [class.active]="mode() === 'register'" [attr.aria-selected]="mode() === 'register'" (click)="setMode('register')">{{ 'auth.register' | t }}</button>
          </div>

          @if (mode() === 'register') {
            <div class="field"><label for="name">{{ 'form.fullName' | t }}</label>
              <input id="name" class="input" formControlName="name" autocomplete="name" />
              <app-field-error [control]="form.controls.name" /></div>
          }
          <div class="field"><label for="em">{{ 'form.email' | t }}</label>
            <input id="em" class="input" type="email" formControlName="email" autocomplete="email" inputmode="email" />
            <app-field-error [control]="form.controls.email" /></div>
          <div class="field"><label for="pw">{{ 'form.password' | t }}</label>
            <div class="input-group">
              <input id="pw" class="input" [type]="show() ? 'text' : 'password'" formControlName="password" [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'" />
              <button type="button" class="icon-btn" (click)="show.update(v => !v)" [attr.aria-label]="'auth.toggle' | t" [attr.aria-pressed]="show()"><app-icon [name]="show() ? 'eye' : 'lock'" [size]="18" /></button>
            </div>
            <app-field-error [control]="form.controls.password" /></div>

          <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="busy()">
            @if (busy()) { <span class="spinner" aria-hidden="true"></span> }
            {{ (mode() === 'login' ? 'nav.signin' : 'auth.register') | t }}
          </button>

          @if (demo) { <p class="note"><app-icon name="info" [size]="15" /> {{ 'auth.demo' | t }}</p> }
          <p class="center muted small"><a routerLink="/">{{ 'auth.guest' | t }}</a></p>
        </form>
      </div>
    </div>
  `,
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toasts = inject(Toasts);
  private readonly i18n = inject(I18n);

  /** From ?returnUrl= (bound by withComponentInputBinding). */
  readonly returnUrl = input<string>();

  protected readonly demo = environment.useMock;
  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly busy = signal(false);
  protected readonly show = signal(false);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  protected setMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.form.controls.name.setValidators(m === 'register' ? [Validators.required, Validators.minLength(2)] : []);
    this.form.controls.name.updateValueAndValidity();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    const { name, email, password } = this.form.getRawValue();
    this.busy.set(true);
    const request = this.mode() === 'login' ? this.auth.login(email, password) : this.auth.register(name.trim(), email, password);
    request.subscribe({
      next: (result) => {
        this.auth.setSession(result);
        this.toasts.success(this.i18n.t('auth.signedIn', { name: result.user.name }));
        const target = this.returnUrl();
        void this.router.navigateByUrl(target && target.startsWith('/') && !target.startsWith('//') ? target : '/account');
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.toasts.error(e instanceof ApiError ? this.i18n.t(e.code) : this.i18n.t('error.generic'));
      },
    });
  }
}
