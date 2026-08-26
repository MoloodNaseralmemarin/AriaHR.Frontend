import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Friendly Persian empty state, reused for: "همه موارد بررسی شده‌اند",
 * empty employee/attendance/request/notification lists, etc.
 * Also doubles as the error state via [isError]="true".
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div
        class="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        [ngClass]="isError ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'"
      >
        <svg *ngIf="!isError" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <svg *ngIf="isError" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <p class="text-sm font-medium text-slate-700">{{ title }}</p>
      <p *ngIf="description" class="mt-1 max-w-xs text-xs text-slate-500">{{ description }}</p>
      <button
        *ngIf="actionLabel"
        (click)="action.emit()"
        type="button"
        class="mt-4 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        [ngClass]="isError
          ? 'bg-rose-600 text-white hover:bg-rose-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'"
      >
        {{ actionLabel }}
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'موردی یافت نشد';
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() isError = false;
  @Output() action = new EventEmitter<void>();
}
