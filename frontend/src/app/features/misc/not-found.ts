import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '../../core/i18n';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page narrow center">
      <p class="nf-code">404</p>
      <h1>{{ 'nf.title' | t }}</h1>
      <p class="muted">{{ 'nf.text' | t }}</p>
      <div class="success-actions">
        <a class="btn btn-primary btn-lg" routerLink="/"><app-icon name="home" [size]="18" /> {{ 'nav.home' | t }}</a>
        <a class="btn btn-secondary btn-lg" routerLink="/shop">{{ 'nav.shop' | t }}</a>
      </div>
    </div>
  `,
})
export class NotFound {}
