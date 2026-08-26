import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

const DEFAULT_DURATION_MS = 2500;
/** How long the fade-out transition takes; the toast is removed from the DOM this long after it starts hiding. */
const EXIT_ANIMATION_MS = 200;

/**
 * Smallest reusable toast mechanism for AriaHR. No notification/toast system
 * existed in the project before this — if one gets added later (or the app
 * grows a need for multiple stacked toasts), replace this rather than
 * layering a second mechanism on top of it.
 *
 * Single active toast by design: this app only ever needs one confirmation
 * on screen at a time. `show()` replaces whatever toast is currently showing.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toast = signal<ToastState | null>(null);
  private readonly _visible = signal(false);
  private nextId = 0;
  private exitTimer?: ReturnType<typeof setTimeout>;
  private removeTimer?: ReturnType<typeof setTimeout>;

  /** The toast currently mounted (still animating out counts as mounted). Null when nothing to show. */
  readonly toast = this._toast.asReadonly();

  /** Whether the mounted toast should be in its visible (vs. fading-out) position. */
  readonly visible = this._visible.asReadonly();

  show(message: string, type: ToastType = 'success', durationMs: number = DEFAULT_DURATION_MS): void {
    clearTimeout(this.exitTimer);
    clearTimeout(this.removeTimer);

    const id = ++this.nextId;
    this._toast.set({ id, message, type });
    this._visible.set(true);

    this.exitTimer = setTimeout(() => {
      this._visible.set(false);
    }, Math.max(durationMs - EXIT_ANIMATION_MS, 0));

    this.removeTimer = setTimeout(() => {
      this._toast.set(null);
    }, durationMs);
  }
}
