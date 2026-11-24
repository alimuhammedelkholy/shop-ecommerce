import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: ToastAction;
}

@Injectable({ providedIn: 'root' })
export class Toasts {
  private nextId = 1;
  readonly items = signal<ToastItem[]>([]);

  show(message: string, type: ToastItem['type'] = 'success', action?: ToastAction, ms = 4500): void {
    const id = this.nextId++;
    this.items.update((list) => [...list.slice(-3), { id, type, message, action }]);
    setTimeout(() => this.dismiss(id), ms);
  }

  success(message: string, action?: ToastAction): void {
    this.show(message, 'success', action);
  }
  error(message: string): void {
    this.show(message, 'error', undefined, 6000);
  }
  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}
