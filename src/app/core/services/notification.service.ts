import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'success' | 'error' | 'info';

export interface AppNotification {
  id: number;
  message: string;
  tone: NotificationTone;
}

const ERROR_DEDUPE_WINDOW_MS = 3000;
const DISMISS_DELAY_MS: Readonly<Record<NotificationTone, number>> = {
  success: 3500,
  info: 4500,
  error: 6000,
};

/**
 * Application-wide toast notifications.
 *
 * The HTTP error interceptor pushes backend failures here, so every dashboard
 * reports errors the same way. Identical errors raised close together (for
 * example two parallel requests failing with the same 400) are shown once.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<readonly AppNotification[]>([]);
  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private lastError: { message: string; at: number } | null = null;
  private sequence = 0;

  readonly notifications = this.items.asReadonly();

  showError(message: string): void {
    const normalized = (message ?? '').trim();
    if (!normalized) {
      return;
    }

    const now = Date.now();
    if (
      this.lastError &&
      this.lastError.message === normalized &&
      now - this.lastError.at < ERROR_DEDUPE_WINDOW_MS
    ) {
      return;
    }

    // Do not stack the same error twice while it is already on screen.
    if (this.items().some((item) => item.tone === 'error' && item.message === normalized)) {
      this.lastError = { message: normalized, at: now };
      return;
    }

    this.lastError = { message: normalized, at: now };
    this.push(normalized, 'error');
  }

  showSuccess(message: string): void {
    this.push(message, 'success');
  }

  showInfo(message: string): void {
    this.push(message, 'info');
  }

  dismiss(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
    this.items.update((list) => list.filter((item) => item.id !== id));
  }

  private push(message: string, tone: NotificationTone): void {
    const normalized = (message ?? '').trim();
    if (!normalized) {
      return;
    }

    const notification: AppNotification = {
      id: ++this.sequence,
      message: normalized,
      tone,
    };

    this.items.update((list) => [...list, notification]);

    const timer = setTimeout(() => this.dismiss(notification.id), DISMISS_DELAY_MS[tone]);
    this.dismissTimers.set(notification.id, timer);
  }
}
