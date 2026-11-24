import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { I18n, TPipe } from '../core/i18n';
import { queryFrom } from '../core/query';
import { ShopApi } from '../core/shop-api';
import { Icon } from '../shared/icon';

interface Entry {
  kind: 'product' | 'category';
  label: string;
  sub: string;
  link: unknown[];
  query?: Record<string, string>;
}

@Component({
  selector: 'app-search',
  imports: [Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocClick($event)',
    '(keydown.escape)': 'close()',
  },
  template: `
    <form class="search" role="search" (submit)="submit($event)">
      <app-icon class="search-icon" name="search" [size]="18" />
      <input
        class="search-input"
        type="search"
        autocomplete="off"
        [placeholder]="'search.placeholder' | t"
        [attr.aria-label]="'search.placeholder' | t"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="panelOpen()"
        aria-controls="search-results"
        [value]="term()"
        (input)="onInput($event)"
        (focus)="open.set(true)"
        (keydown.arrowdown)="move(1, $event)"
        (keydown.arrowup)="move(-1, $event)"
      />
      @if (term()) {
        <button type="button" class="search-clear" (click)="clear()" [attr.aria-label]="'a11y.clear' | t">
          <app-icon name="close" [size]="14" />
        </button>
      }

      @if (panelOpen()) {
        <div class="search-panel" id="search-results" role="listbox">
          @if (state().status === 'loading' && !entries().length) {
            <div class="search-hint">{{ 'search.loading' | t }}</div>
          } @else if (!entries().length) {
            <div class="search-hint">{{ 'search.none' | t: { q: term() } }}</div>
          } @else {
            @for (e of entries(); track $index) {
              <button type="button" class="search-item" role="option" [class.active]="$index === active()" [attr.aria-selected]="$index === active()" (mousedown)="$event.preventDefault()" (click)="go(e)">
                <app-icon [name]="e.kind === 'product' ? 'search' : 'tag'" [size]="16" />
                <span class="search-item-label">{{ e.label }}</span>
                <span class="search-item-sub">{{ e.sub }}</span>
              </button>
            }
            <button type="button" class="search-all" (mousedown)="$event.preventDefault()" (click)="submitTerm()">
              {{ 'search.all' | t: { q: term() } }}
            </button>
          }
        </div>
      }
    </form>
  `,
})
export class Search {
  private readonly api = inject(ShopApi);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly i18n = inject(I18n);

  protected readonly term = signal('');
  protected readonly open = signal(false);
  protected readonly active = signal(-1);

  protected readonly state = queryFrom(
    () => this.term().trim(),
    (t) => (t.length >= 2 ? this.api.suggest(t) : of({ products: [], categories: [] })),
    { debounceMs: 180 },
  );

  protected readonly entries = computed<Entry[]>(() => {
    if (this.term().trim().length < 2) return [];
    const data = this.state().data;
    if (!data) return [];
    const cats: Entry[] = data.categories.map((c) => ({
      kind: 'category',
      label: this.i18n.pick(c.name, c.nameAr),
      sub: this.i18n.t('search.category'),
      link: ['/shop'],
      query: { category: c.slug },
    }));
    const prods: Entry[] = data.products.map((p) => ({
      kind: 'product',
      label: this.i18n.pick(p.name, p.nameAr),
      sub: this.i18n.money(p.basePrice),
      link: ['/product', p.slug],
    }));
    return [...cats, ...prods];
  });

  protected readonly panelOpen = computed(() => this.open() && this.term().trim().length >= 2);

  protected onInput(e: Event): void {
    this.term.set((e.target as HTMLInputElement).value);
    this.active.set(-1);
    this.open.set(true);
  }

  protected move(delta: number, e: Event): void {
    e.preventDefault();
    const n = this.entries().length;
    if (!n) return;
    this.open.set(true);
    this.active.update((i) => (i + delta + n + (i === -1 && delta < 0 ? 1 : 0)) % n);
  }

  protected submit(e: Event): void {
    e.preventDefault();
    const entry = this.entries()[this.active()];
    if (entry) this.go(entry);
    else this.submitTerm();
  }

  protected submitTerm(): void {
    const q = this.term().trim();
    if (!q) return;
    this.close();
    void this.router.navigate(['/shop'], { queryParams: { q } });
  }

  protected go(e: Entry): void {
    this.close();
    this.term.set('');
    void this.router.navigate(e.link, { queryParams: e.query });
  }

  protected clear(): void {
    this.term.set('');
    this.active.set(-1);
  }

  protected close(): void {
    this.open.set(false);
    this.active.set(-1);
  }

  protected onDocClick(e: Event): void {
    if (!this.host.nativeElement.contains(e.target as Node)) this.close();
  }
}
