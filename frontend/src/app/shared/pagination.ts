import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Icon } from './icon';
import { I18n, TPipe } from '../core/i18n';

@Component({
  selector: 'app-pagination',
  imports: [Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pages() > 1) {
      <nav class="pager" [attr.aria-label]="'a11y.pagination' | t">
        <button type="button" class="pager-btn" [disabled]="page() <= 1" (click)="go(page() - 1)" [attr.aria-label]="'a11y.prev' | t">
          <app-icon class="flip-rtl" name="chevron-left" [size]="16" />
        </button>
        @for (n of items(); track $index) {
          @if (n === 0) {
            <span class="pager-gap" aria-hidden="true">…</span>
          } @else {
            <button type="button" class="pager-btn" [class.active]="n === page()" [attr.aria-current]="n === page() ? 'page' : null" (click)="go(n)">
              {{ i18n.num(n) }}
            </button>
          }
        }
        <button type="button" class="pager-btn" [disabled]="page() >= pages()" (click)="go(page() + 1)" [attr.aria-label]="'a11y.next' | t">
          <app-icon class="flip-rtl" name="chevron-right" [size]="16" />
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  protected readonly i18n = inject(I18n);
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly pageChange = output<number>();

  /** 0 means an ellipsis. */
  protected readonly items = computed(() => {
    const total = this.pages();
    const cur = this.page();
    const set = new Set([1, total, cur, cur - 1, cur + 1]);
    const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const out: number[] = [];
    nums.forEach((n, i) => {
      if (i > 0 && n - nums[i - 1] > 1) out.push(0);
      out.push(n);
    });
    return out;
  });

  protected go(n: number): void {
    if (n >= 1 && n <= this.pages() && n !== this.page()) this.pageChange.emit(n);
  }
}
