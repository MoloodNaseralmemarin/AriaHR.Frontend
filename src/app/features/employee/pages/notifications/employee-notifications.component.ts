import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">اعلان‌ها و پیام‌ها</h1>
        <p class="mt-1 text-xs text-slate-500 sm:text-sm">اطلاعیه‌های سازمانی، پیام‌های مدیر مرکز و بروزرسانی‌های درخواست‌ها</p>
      </div>

      <!-- Clean Empty State Container -->
      <div class="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-2xs space-y-4">
        <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-2xl font-bold">
          🔔
        </div>
        <div class="space-y-1.5 max-w-sm mx-auto">
          <h2 class="text-base font-bold text-slate-800">هیچ اعلانی یافت نشد</h2>
          <p class="text-xs text-slate-500 leading-relaxed">
            در حال حاضر هیچ پیام یا اطلاعیه جدیدی برای شما ثبت نشده است. اعلان‌های مربوط به تایید درخواست‌ها و اطلاعیه‌های مرکز در این بخش نمایش داده می‌شوند.
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeNotificationsComponent {}
