import { Injectable, signal } from '@angular/core';

/** Cross-cutting UI state (drawers, overlays). */
@Injectable({ providedIn: 'root' })
export class Ui {
  readonly cartOpen = signal(false);
  readonly menuOpen = signal(false);
  readonly announcementOpen = signal(true);

  openCart(): void {
    this.menuOpen.set(false);
    this.cartOpen.set(true);
  }
  closeAll(): void {
    this.cartOpen.set(false);
    this.menuOpen.set(false);
  }
}
