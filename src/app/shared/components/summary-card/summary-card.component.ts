import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SummaryTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Compact stat card: label + big number + optional icon + tone accent.
 * Redesigned with a balanced flex-col layout: top header containing icon + label,
 * and bottom area displaying the statistic value for equal height alignment.
 */
@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full min-w-0',
  },
  template: `
    <div
      class="flex h-full w-full flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <!-- Top Section: Header with Icon and Label -->
      <div class="flex items-start justify-between gap-2 min-w-0">
        <p class="text-xs sm:text-sm font-medium text-slate-500 leading-snug min-w-0 flex-1">
          {{ label }}
        </p>
        <div
          class="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl"
          [ngClass]="iconWrapClasses()"
        >
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>

      <!-- Bottom Section: Statistic Value -->
      <div class="pt-1">
        <p class="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
          {{ value }}
        </p>
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
