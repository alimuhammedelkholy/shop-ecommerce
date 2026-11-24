import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Icon } from './icon';
import { I18n, TPipe } from '../core/i18n';

/** Scroll-snap carousel. Project any children (e.g. product cards) as slides. */
@Component({
  selector: 'app-carousel',
  imports: [Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="carousel">
      <button type="button" class="carousel-btn carousel-prev" (click)="scroll(-1)" [attr.aria-label]="'a11y.prev' | t">
        <app-icon class="flip-rtl" name="chevron-left" [size]="18" />
      </button>
      <div class="carousel-track" #track tabindex="0"><ng-content /></div>
      <button type="button" class="carousel-btn carousel-next" (click)="scroll(1)" [attr.aria-label]="'a11y.next' | t">
        <app-icon class="flip-rtl" name="chevron-right" [size]="18" />
      </button>
    </div>
  `,
})
export class Carousel {
  private readonly i18n = inject(I18n);
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  protected scroll(direction: 1 | -1): void {
    const el = this.track().nativeElement;
    const rtl = this.i18n.isRtl() ? -1 : 1;
    el.scrollBy({ left: direction * rtl * el.clientWidth * 0.85, behavior: 'smooth' });
  }
}
