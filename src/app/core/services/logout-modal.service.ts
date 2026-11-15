import { Injectable, inject, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';

/**
 * Owns the single logout confirmation dialog for the whole application.
 *
 * The dialog used to be rendered inside each role layout (for example inside
 * the center-manager sidebar). A `position: sticky` sidebar creates its own
 * stacking context, so the dialog's `z-index` was scoped under the sidebar and
 * page content — including the Leaflet map on the work-location page — painted
 * above it. Hosting the dialog once at the application root keeps it out of any
 * layout stacking context, so every dashboard shares the same reliable overlay.
 */
@Injectable({ providedIn: 'root' })
export class LogoutModalService {
  private readonly authService = inject(AuthService);

  private readonly openState = signal(false);

  /** Whether the logout confirmation dialog is currently visible. */
  readonly isOpen = this.openState.asReadonly();

  /** Shows the logout confirmation without logging the user out yet. */
  open(): void {
    this.openState.set(true);
  }

  /** Dismisses the dialog without changing the session. */
  close(): void {
    this.openState.set(false);
  }

  /** Confirms logout: closes the dialog and ends the session. */
  confirm(): void {
    this.openState.set(false);
    this.authService.logout();
  }
}
