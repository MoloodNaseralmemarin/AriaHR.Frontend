import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgFor } from '@angular/common';

/**
 * Skeleton loader used while lists/cards are "loading" (mock delay).
 * variant="row"  -> table-like row skeleton (Attendance / Employees desktop)
 * variant="card" -> card skeleton (Employees mobile, Requests, Shifts)
 */
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule, NgFor],
  template: `
    <div class="space-y-3" aria-hidden="true">
      <ng-container *ngIf="variant === 'row'">
        <div
          *ngFor="let i of counter(count)"
          class="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3"
        >
          <div class="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/3 animate-pulse rounded bg-slate-200"></div>
            <div class="h-2.5 w-1/5 animate-pulse rounded bg-slate-100"></div>
          </div>
          <div class="h-6 w-16 animate-pulse rounded-full bg-slate-100"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'card'">
        <div
          *ngFor="let i of counter(count)"
          class="rounded-2xl border border-slate-100 bg-white p-4"
        >
          <div class="mb-3 flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-2/5 animate-pulse rounded bg-slate-200"></div>
              <div class="h-2.5 w-1/4 animate-pulse rounded bg-slate-100"></div>
            </div>
          </div>
          <div class="h-2.5 w-full animate-pulse rounded bg-slate-100"></div>
          <div class="mt-2 h-2.5 w-3/4 animate-pulse rounded bg-slate-100"></div>
        </div>
      </ng-container>
    </div>
  `,
})
export class SkeletonLoaderComponent {
  @Input() variant: 'row' | 'card' = 'row';
  @Input() count = 4;

  counter(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
