import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 text-right" dir="rtl">
        <h3 class="text-base font-bold text-slate-900">{{ title }}</h3>
        <p class="text-sm text-slate-600 leading-relaxed">{{ description }}</p>
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            (click)="cancel.emit()"
            class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            {{ cancelText || 'انصراف' }}
          </button>
          <button
            type="button"
            (click)="confirm.emit()"
            class="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
          >
            {{ confirmText || 'حذف' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DeleteConfirmationComponent {
  @Input() title = 'حذف';
  @Input() description = '';
  @Input() confirmText = 'حذف';
  @Input() cancelText = 'انصراف';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
