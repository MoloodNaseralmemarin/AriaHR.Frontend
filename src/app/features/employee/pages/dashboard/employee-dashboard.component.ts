import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-bold text-slate-800 sm:text-2xl">داشبورد کارمند</h1>
        <p class="mt-1 text-xs text-slate-500 sm:text-sm">خلاصه وضعیت حضور، مرخصی‌ها و درخواست‌های فعال شما</p>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p class="text-xs font-medium text-slate-500">ساعت کار این ماه</p>
          <p class="mt-2 text-xl font-bold text-slate-800">۱۴۲ <span class="text-xs font-normal text-slate-400">ساعت</span></p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p class="text-xs font-medium text-slate-500">باقیمانده مرخصی استحقاقی</p>
          <p class="mt-2 text-xl font-bold text-emerald-600">۱۲ <span class="text-xs font-normal text-slate-400">روز</span></p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p class="text-xs font-medium text-slate-500">تاخیر این ماه</p>
          <p class="mt-2 text-xl font-bold text-amber-600">۱۵ <span class="text-xs font-normal text-slate-400">دقیقه</span></p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p class="text-xs font-medium text-slate-500">درخواست‌های در انتظار</p>
          <p class="mt-2 text-xl font-bold text-blue-600">۲ <span class="text-xs font-normal text-slate-400">مورد</span></p>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 class="text-sm font-bold text-slate-800">دسترسی سریع</h2>
        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <a routerLink="/employee/attendance" class="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
            <span class="text-2xl">⏱</span>
            <span class="mt-2 text-xs font-medium text-slate-700">ثبت و مشاهد حضور</span>
          </a>
          <a routerLink="/employee/leaves" class="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
            <span class="text-2xl">🌴</span>
            <span class="mt-2 text-xs font-medium text-slate-700">درخواست مرخصی</span>
          </a>
          <a routerLink="/employee/requests" class="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
            <span class="text-2xl">📝</span>
            <span class="mt-2 text-xs font-medium text-slate-700">پیگیری درخواست‌ها</span>
          </a>
          <a routerLink="/employee/profile" class="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100">
            <span class="text-2xl">👤</span>
            <span class="mt-2 text-xs font-medium text-slate-700">پروفایل پرسنلی</span>
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDashboardComponent {}
