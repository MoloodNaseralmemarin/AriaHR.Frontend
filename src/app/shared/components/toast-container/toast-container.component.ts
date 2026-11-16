import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../toast/toast.component';

/**
 * Global toast host, rendered once in `App` so API errors appear consistently
 * on every dashboard. Toasts auto-dismiss through the notification service and
 * can be dismissed manually.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2 px-4"
      role="region"
      aria-live="polite"
      aria-label="پیام‌های سیستم"
    >
      @for (notification of notifications(); track notification.id) {
        <div
          class="pointer-events-auto w-full max-w-sm cursor-pointer"
          role="button"
          tabindex="0"
          [attr.aria-label]="'بستن پیام: ' + notification.message"
          (click)="dismiss(notification.id)"
          (keydown.enter)="dismiss(notification.id)"
          (keydown.space)="dismiss(notification.id)"
        >
          <app-toast [message]="notification.message" [tone]="notification.tone" />
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
