import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from './icon';
import { Toasts } from '../core/toast';
import { TPipe } from '../core/i18n';

@Component({
  selector: 'app-toasts',
  imports: [Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (t of toasts.items(); track t.id) {
        <div class="toast" [attr.data-type]="t.type" role="status">
          <app-icon class="toast-icon" [name]="t.type === 'success' ? 'check' : t.type === 'error' ? 'alert' : 'info'" [size]="18" />
          <span class="toast-msg">{{ t.message }}</span>
          @if (t.action; as a) {
            <button type="button" class="toast-action" (click)="a.run(); toasts.dismiss(t.id)">{{ a.label }}</button>
          }
          <button type="button" class="toast-close" (click)="toasts.dismiss(t.id)" [attr.aria-label]="'a11y.close' | t">
            <app-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(Toasts);
}
