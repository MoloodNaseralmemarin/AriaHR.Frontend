import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Small pill/badge used everywhere status needs to be shown:
 * attendance status, request status, shift status, employee active/inactive.
 *
 * Usage:
 *   <app-status-badge tone="success" label="حاضر"></app-status-badge>
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      [ngClass]="toneClasses()"
    >
      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="dotClasses()"></span>
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: BadgeTone = 'neutral';

  private toneSignal = signal<BadgeTone>('neutral');

  toneClasses = computed(() => {
    switch (this.tone) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
      case 'info':
        return 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200';
      default:
        return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
    }
  });

  dotClasses = computed(() => {
    switch (this.tone) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-rose-500';
      case 'info':
        return 'bg-sky-500';
      default:
        return 'bg-slate-400';
    }
  });
}
