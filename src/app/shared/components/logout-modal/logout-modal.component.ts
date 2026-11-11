import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Standardized Persian modal dialog for confirming logout across all roles and layouts.
 */
@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 text-right transition-all transform scale-100"
          dir="rtl"
        >
          <div class="flex items-center gap-3.5">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 id="logout-dialog-title" class="text-base font-bold text-slate-900">
                خروج از حساب کاربری
              </h3>
              <p class="mt-0.5 text-xs text-slate-500">
                پایان نشست کاری در سامانه AriaHR
              </p>
            </div>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed">
            آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟ برای دسترسی مجدد نیاز به ورود با شماره همراه خواهید داشت.
          </p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="cancel.emit()"
              class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              (click)="confirm.emit()"
              class="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 active:bg-rose-800 cursor-pointer shadow-xs"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LogoutModalComponent {
  @Input() isOpen = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
