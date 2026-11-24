import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Glyph } from '../core/models';
import { Icon } from './icon';

/**
 * Generated product artwork (gradient + glyph). It keeps the demo fully offline and
 * is replaced by <img [src]> once real product images are served by the API.
 */
@Component({
  selector: 'app-art',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="art" [style.--h]="hue()" [style.--tint]="tint()" [attr.data-v]="view()">
      <span class="art-blob art-blob-1"></span>
      <span class="art-blob art-blob-2"></span>
      <span class="art-shadow"></span>
      <span class="art-glyph"><app-icon [name]="glyph()" size="100%" [stroke]="1.15" class="fill" /></span>
    </div>
  `,
  styles: `:host { display: block; width: 100%; height: 100%; }`,
})
export class Art {
  readonly hue = input.required<number>();
  readonly glyph = input.required<Glyph>();
  readonly view = input<number>(0);
  readonly tint = input<string | null>(null);
}
