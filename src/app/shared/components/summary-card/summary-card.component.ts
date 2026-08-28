import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SummaryTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Compact stat card: label + big number + optional icon + tone accent.
 * Used for the four "Today's Overview" cards on the dashboard and on
 * the Reports page.
 */
@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        [ngClass]="iconWrapClasses()"
      >
        <ng-content select="[icon]"></ng-content>
      </div>
      <div class="min-w-0">
        <p class="text-sm text-slate-500">{{ label }}</p>
        <p class="mt-0.5 text-xl font-bold text-slate-800">{{ value }}</p>
      </div>
    </div>
  `,
})
export class SummaryCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() tone: SummaryTone = 'default';

  iconWrapClasses() {
    switch (this.tone) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600';
      case 'warning':
        return 'bg-amber-50 text-amber-600';
      case 'danger':
        return 'bg-rose-50 text-rose-600';
      case 'info':
        return 'bg-sky-50 text-sky-600';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  }
}
