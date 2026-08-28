import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-employee-placeholder-page',
  standalone: true,
  template: `
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center space-y-3">
      <div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-xl font-bold">
        ℹ️
      </div>
      <h2 class="text-base font-bold text-slate-800">این صفحه پس از تایید UI پیاده‌سازی خواهد شد.</h2>
      <p class="text-xs text-slate-500">پوسته ساختاری جهت تست مسیریابی نقش Employee آماده شده است.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeePlaceholderPageComponent {}
