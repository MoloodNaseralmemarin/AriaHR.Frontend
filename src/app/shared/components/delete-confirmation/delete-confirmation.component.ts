import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmationTone = 'danger' | 'warning' | 'primary';

/**
 * Small modal used for destructive or state-changing confirmations.
 * It sits on the global modal layer so it is never hidden behind Leaflet maps.
 */
@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="app-modal-layer fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      (click)="onBackdropClick($event)"
    >
      <div
        class="my-4 w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-xl sm:p-6"
        dir="rtl"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start gap-3">
          <div [class]="iconClass">
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 9v4M12 17h.01"></path>
              <path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path>
            </svg>
          </div>
          <div class="min-w-0">
            <h3 id="confirmation-dialog-title" class="text-base font-bold text-slate-900">{{ title }}</h3>
            <p class="mt-1 text-sm leading-6 text-slate-600">{{ description }}</p>
          </div>
        </div>

        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            #cancelButton
            type="button"
            (click)="cancel.emit()"
            [disabled]="busy"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {{ cancelText || 'انصراف' }}
          </button>
          <button
            type="button"
            (click)="confirm.emit()"
            [disabled]="busy"
            [class]="confirmClass"
          >
            @if (busy) {
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            }
            {{ busy ? 'در حال انجام…' : confirmText || 'تأیید' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DeleteConfirmationComponent implements AfterViewInit {
  @Input() title = 'تأیید عملیات';
  @Input() description = '';
  @Input() confirmText = 'تأیید';
  @Input() cancelText = 'انصراف';
  @Input() tone: ConfirmationTone = 'danger';
  @Input() busy = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  get iconClass(): string {
    const base = 'flex h-10 w-10 flex-none items-center justify-center rounded-xl';
    if (this.tone === 'warning') return `${base} bg-amber-50 text-amber-600`;
    if (this.tone === 'primary') return `${base} bg-blue-50 text-blue-600`;
    return `${base} bg-rose-50 text-rose-600`;
  }

  get confirmClass(): string {
    const base =
      'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto';
    if (this.tone === 'warning') return `${base} bg-amber-600 hover:bg-amber-700`;
    if (this.tone === 'primary') return `${base} bg-blue-600 hover:bg-blue-700`;
    return `${base} bg-rose-600 hover:bg-rose-700`;
  }

  ngAfterViewInit(): void {
    // Cancel is the safe default, so focus it rather than the destructive action.
    this.cancelButton?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy) {
      this.cancel.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.busy && event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
