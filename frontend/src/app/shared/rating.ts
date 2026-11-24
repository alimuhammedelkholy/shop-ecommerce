import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-rating',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" role="img" [attr.aria-label]="value() + ' / 5'">
      <span class="stars-row stars-bg">
        @for (i of five; track i) { <app-icon name="star" [size]="size()" [filled]="true" /> }
      </span>
      <span class="stars-row stars-fg" [style.width.%]="percent()">
        @for (i of five; track i) { <app-icon name="star" [size]="size()" [filled]="true" /> }
      </span>
    </span>
  `,
})
export class Rating {
  readonly value = input.required<number>();
  readonly size = input<number>(16);
  protected readonly five = [1, 2, 3, 4, 5];
  protected readonly percent = computed(() => Math.max(0, Math.min(100, (this.value() / 5) * 100)));
}
