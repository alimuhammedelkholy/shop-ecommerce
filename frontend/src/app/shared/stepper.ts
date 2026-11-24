import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from './icon';
import { TPipe } from '../core/i18n';

/** Quantity stepper with two-way binding: <app-stepper [(value)]="qty" [max]="5" /> */
@Component({
  selector: 'app-stepper',
  imports: [Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" role="group" [attr.aria-label]="'a11y.quantity' | t">
      <button type="button" class="stepper-btn" (click)="change(-1)" [disabled]="value() <= min()" [attr.aria-label]="'a11y.decrease' | t">
        <app-icon name="minus" [size]="16" />
      </button>
      <output class="stepper-value" aria-live="polite">{{ value() }}</output>
      <button type="button" class="stepper-btn" (click)="change(1)" [disabled]="atMax()" [attr.aria-label]="'a11y.increase' | t">
        <app-icon name="plus" [size]="16" />
      </button>
    </div>
  `,
})
export class Stepper {
  readonly value = model.required<number>();
  readonly min = input<number>(1);
  readonly max = input<number>(10);
  protected readonly atMax = computed(() => this.value() >= this.max());

  protected change(delta: number): void {
    this.value.set(Math.max(this.min(), Math.min(this.max(), this.value() + delta)));
  }
}
