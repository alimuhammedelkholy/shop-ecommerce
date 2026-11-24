import { DOCUMENT } from '@angular/common';
import { Injectable, Pipe, PipeTransform, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { DICT } from './translations';

export type Lang = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly doc = inject(DOCUMENT);
  readonly lang = signal<Lang>(this.initial());
  readonly isRtl = computed(() => this.lang() === 'ar');
  private readonly locale = computed(() => (this.lang() === 'ar' ? 'ar-EG' : 'en-US'));
  private readonly currency = computed(
    () =>
      new Intl.NumberFormat(this.locale(), {
        style: 'currency',
        currency: environment.currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }),
  );
  private readonly number = computed(() => new Intl.NumberFormat(this.locale()));
  private readonly pad = computed(() => new Intl.NumberFormat(this.locale(), { minimumIntegerDigits: 2, useGrouping: false }));

  constructor() {
    effect(() => {
      const lang = this.lang();
      const root = this.doc.documentElement;
      root.lang = lang;
      root.dir = lang === 'ar' ? 'rtl' : 'ltr';
      try {
        localStorage.setItem('shop.lang', lang);
      } catch {
        /* ignore */
      }
    });
  }

  toggle(): void {
    this.lang.update((l) => (l === 'en' ? 'ar' : 'en'));
  }

  /** Translate a key. `{name}` placeholders are replaced from `params`. */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.lang();
    let text = DICT[lang][key] ?? DICT.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
    }
    return text;
  }

  /** Choose the Arabic value when the UI is Arabic and one exists. */
  pick(en: string | undefined, ar?: string | undefined): string {
    return this.lang() === 'ar' && ar ? ar : (en ?? '');
  }

  money(value: number): string {
    return this.currency().format(value);
  }

  num(value: number): string {
    return this.number().format(value);
  }

  pad2(value: number): string {
    return this.pad().format(value);
  }

  date(value: string | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
    return new Intl.DateTimeFormat(this.locale(), opts).format(new Date(value));
  }

  private initial(): Lang {
    try {
      return localStorage.getItem('shop.lang') === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }
}

/** `{{ 'nav.shop' | t }}`. Impure on purpose so it re-evaluates when the language signal changes. */
@Pipe({ name: 't', pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18n);
  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
