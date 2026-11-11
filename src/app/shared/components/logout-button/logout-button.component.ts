import { Component, Input, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Single shared logout control for the three dashboards (System Admin, Center Manager, Employee).
 *
 * - `sidebar`: full-width labelled button at the bottom of the desktop sidebar.
 * - `nav`: compact item rendered inside the mobile bottom navigation.
 *
 * Both variants delegate to the existing AuthService.logout() so backend invalidation,
 * client-side token/session cleanup and the redirect to /login stay in one place.
 */
@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [],
  template: `
    @if (variant === 'nav') {
      <button
        type="button"
        (click)="onLogout()"
        class="flex w-16 shrink-0 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-rose-500 transition-colors hover:text-rose-600"
        title="خروج از حساب"
        aria-label="خروج از حساب"
      >
        <span class="flex h-5 w-5 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </span>
        <span class="max-w-full truncate">خروج</span>
      </button>
    } @else {
      <button
        type="button"
        (click)="onLogout()"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
        title="خروج از حساب"
        aria-label="خروج از حساب"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>خروج از حساب</span>
      </button>
    }
  `,
})
export class LogoutButtonComponent {
  @Input() variant: 'sidebar' | 'nav' = 'sidebar';

  private readonly authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout();
  }
}
