import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TPipe } from '../core/i18n';

/**
 * Shows the first validation message of a control once it was touched.
 * Intentionally uses default change detection: form state (touched/invalid) is not signal-based,
 * so this component must re-check whenever its parent view is checked.
 */
@Component({
  selector: 'app-field-error',
  imports: [TPipe],
  template: `
    @if (control().touched && control().invalid) {
      <small class="field-error" role="alert">{{ key() | t }}</small>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  /** Not a signal-derived value on purpose: recomputed on every check. */
  protected key(): string {
    const e = this.control().errors ?? {};
    if (e['required']) return 'form.required';
    if (e['email']) return 'form.email';
    if (e['card']) return 'form.card';
    if (e['expiry']) return 'form.expiry';
    if (e['cvc']) return 'form.cvc';
    if (e['phone']) return 'form.phone';
    if (e['match']) return 'form.match';
    if (e['minlength']) return 'form.minlength';
    return 'form.invalid';
  }
}
