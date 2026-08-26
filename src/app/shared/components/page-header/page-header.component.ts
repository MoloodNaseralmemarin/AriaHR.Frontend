import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Consistent page header used at the top of every Center Manager screen.
 * Slot "actions" is for a primary button (e.g. "افزودن شیفت").
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-lg font-bold text-slate-800 sm:text-xl">{{ title }}</h1>
        <p *ngIf="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-2">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
