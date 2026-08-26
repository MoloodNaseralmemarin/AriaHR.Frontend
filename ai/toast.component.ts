import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

/**
 * Renders the app's single active toast. Mount this once per page that
 * needs it (e.g. `<app-toast />` near the end of the page template).
 *
 * Non-blocking by design: fixed-position, doesn't intercept clicks on the
 * rest of the page (only the toast pill itself is interactive-sized), and
 * dismisses itself — no action required from the user.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
