import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveSummaryDto } from '../../models/leave-request.model';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-employee-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, PersianDigitsPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">پرتال درخواست‌ها</h1>
          <p class="mt-1 text-xs text-slate-500 sm:text-sm">مدیریت درخواست‌های مرخصی و پیگیری وضعیت آنها</p>
        </div>
        <a
          routerLink="/employee/leave-requests/new"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <span>➕</span>
          <span>ثبت درخواست مرخصی جدید</span>
        </a>
      </div>

      <!-- Quick Leave Overview Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs text-center space-y-1">
          <span class="block text-xs font-medium text-slate-500">کل درخواست‌ها</span>
          <strong class="block text-xl font-bold text-slate-800">
            {{ totalRequestsCount() | persianDigits }}
          </strong>
        </div>

        <div class="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs text-center space-y-1">
          <span class="block text-xs font-medium text-amber-700">در انتظار بررسی</span>
          <strong class="block text-xl font-bold text-amber-800">
            {{ (summary()?.pendingCount ?? 0) | persianDigits }}
          </strong>
        </div>

        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs text-center space-y-1">
          <span class="block text-xs font-medium text-emerald-700">تایید شده</span>
          <strong class="block text-xl font-bold text-emerald-800">
            {{ (summary()?.approvedCount ?? 0) | persianDigits }}
          </strong>
        </div>

        <div class="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs text-center space-y-1">
          <span class="block text-xs font-medium text-rose-700">رد شده</span>
          <strong class="block text-xl font-bold text-rose-800">
            {{ (summary()?.rejectedCount ?? 0) | persianDigits }}
          </strong>
        </div>
      </div>

      <!-- Request Categories Portals -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <!-- Leave Requests Portal Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-lg font-bold">
                🌴
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">مرخصی‌های من</h2>
                <p class="text-xs text-slate-500">مشاهده لیست سوابق و وضعیت مرخصی‌های روزانه و ساعتی</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed pt-2">
              شما می‌توانید درخواست‌های مرخصی قبلی خود را مشاهده کنید، وضعیت تایید یا رد را پیگیری کنید و یا درخواست جدید ثبت نمایید.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-3 border-t border-slate-100">
            <a
              routerLink="/employee/leave-requests"
              class="flex-1 text-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              لیست سوابق مرخصی
            </a>
            <a
              routerLink="/employee/leave-requests/new"
              class="flex-1 text-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              ثبت درخواست جدید
            </a>
          </div>
        </div>

        <!-- Attendance & Time Records Portal Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 text-lg font-bold">
                ⏱
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">تردد و کارکرد</h2>
                <p class="text-xs text-slate-500">ثبت ورود و خروج با اسکن بارکد و بررسی شیفت کاری</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed pt-2">
              جهت ثبت ورود و خروج در محل خدمت، اسکن کد QR و ارسال موقعیت مکانی از این بخش استفاده کنید.
            </p>
          </div>

          <div class="pt-3 border-t border-slate-100">
            <a
              routerLink="/employee/attendance"
              class="block w-full text-center rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              ورود به صفحه ثبت تردد
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeRequestsComponent implements OnInit {
  private readonly leaveService = inject(LeaveRequestService);

  readonly summary = signal<LeaveSummaryDto | null>(null);

  readonly totalRequestsCount = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return (s.pendingCount || 0) + (s.approvedCount || 0) + (s.rejectedCount || 0);
  });

  ngOnInit(): void {
    this.leaveService.getLeaveRequests().subscribe({
      next: (list) => {
        const reqs = list || [];
        const pending = reqs.filter((r) => r.status === 'pending').length;
        const approved = reqs.filter((r) => r.status === 'approved').length;
        const rejected = reqs.filter((r) => r.status === 'rejected').length;
        this.summary.set({ pendingCount: pending, approvedCount: approved, rejectedCount: rejected });
      },
      error: () => {},
    });
  }
}
