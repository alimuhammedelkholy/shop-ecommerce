import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-empty',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="empty-icon"><app-icon [name]="icon()" [size]="34" [stroke]="1.5" /></div>
      <h2 class="empty-title">{{ title() }}</h2>
      @if (text()) { <p class="empty-text">{{ text() }}</p> }
      <div class="empty-actions"><ng-content /></div>
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<string>('package');
  readonly title = input.required<string>();
  readonly text = input<string>('');
}
