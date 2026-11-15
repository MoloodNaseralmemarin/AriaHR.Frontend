import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoutModalService } from '../../../core/services/logout-modal.service';

/**
 * Standardized shared logout control for all dashboards (System Admin, Center Manager, Employee).
 *
 * Supports variants:
 * - `sidebar`: full-width button for desktop sidebar.
 * - `nav`: compact item for mobile navigation.
 * - `menu-item`: full-width button item inside mobile bottom sheets / drawers.
 *
 * Always confirms logout with a Persian modal dialog before triggering AuthService.logout().
 * The dialog itself is rendered once at the application root (see app.html) so that no
 * layout or map can ever paint above it.
 */
@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (variant === 'nav') {
      <button
        type="button"
        (click)="openModal()"
        class="flex w-16 shrink-0 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-rose-500 transition-colors hover:text-rose-600 cursor-pointer"
        title="خروج از حساب"
        aria-label="خروج از حساب"
      >
        <span class="flex h-5 w-5 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </span>
        <span class="max-w-full truncate">خروج</span>
      </button>
    } @else if (variant === 'menu-item') {
      <button
        type="button"
        (click)="openModal()"
        class="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
        title="خروج از حساب"
        aria-label="خروج از حساب"
      >
        <div class="flex items-center gap-3">
          <span class="flex h-5 w-5 items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <span>خروج از حساب</span>
        </div>
      </button>
    } @else {
      <button
        type="button"
        (click)="openModal()"
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
  @Input() variant: 'sidebar' | 'nav' | 'menu-item' = 'sidebar';

  private readonly logoutModal = inject(LogoutModalService);

  /** Opens the shared, app-level logout confirmation dialog. */
  openModal(): void {
    this.logoutModal.open();
  }

  /**
   * Kept for backward compatibility with programmatic triggers and specs.
   */
  onLogout(): void {
    this.openModal();
  }
}
