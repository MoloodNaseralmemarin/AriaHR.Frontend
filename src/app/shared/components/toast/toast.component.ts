import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastTone = 'success' | 'error' | 'info';

/**
 * Professional Persian toast used for confirmations such as "درخواست تأیید شد".
 * This is a pure presentational component — parent screens control visibility
 * with a boolean/signal and a setTimeout for auto-dismiss (mock only).
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-lg"
      [ngClass]="borderClasses()"
      role="status"
    >
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" [ngClass]="iconWrapClasses()">
        <svg *ngIf="tone === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <svg *ngIf="tone === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        <svg *ngIf="tone === 'info'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/></svg>
      </div>
      <p class="text-sm font-medium text-slate-700">{{ message }}</p>
    </div>
  `,
})
export class ToastComponent {
  @Input() message = '';
  @Input() tone: ToastTone = 'success';

  borderClasses() {
    switch (this.tone) {
      case 'error':
        return 'border-rose-100';
      case 'info':
        return 'border-sky-100';
      default:
        return 'border-emerald-100';
    }
  }

  iconWrapClasses() {
    switch (this.tone) {
      case 'error':
        return 'bg-rose-50 text-rose-600';
      case 'info':
        return 'bg-sky-50 text-sky-600';
      default:
        return 'bg-emerald-50 text-emerald-600';
    }
  }
}
