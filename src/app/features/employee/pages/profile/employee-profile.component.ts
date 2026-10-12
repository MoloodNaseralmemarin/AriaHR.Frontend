import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, PersianDigitsPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">پروفایل کاربری</h1>
        <p class="mt-1 text-xs text-slate-500 sm:text-sm">اطلاعات حساب و پروفایل شغلی ثبت شده در سازمان</p>
      </div>

      @if (isLoading()) {
        <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs animate-pulse space-y-3">
          <div class="mx-auto h-16 w-16 rounded-full bg-slate-200"></div>
          <div class="mx-auto h-5 w-40 rounded-md bg-slate-200"></div>
          <div class="mx-auto h-4 w-56 rounded-md bg-slate-100"></div>
        </div>
      } @else if (user(); as u) {
        <!-- Profile Overview Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-md">
              {{ avatarInitial() }}
            </div>
            <div class="text-center sm:text-right space-y-1">
              <h2 class="text-lg font-bold text-slate-900">{{ fullName() }}</h2>
              <p class="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block">
                {{ roleTitle() }}
              </p>
              <p class="text-xs text-slate-500 pt-1">شناسه کاربری: <span class="font-mono">{{ u.id || '---' }}</span></p>
            </div>
          </div>

          <!-- Information Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span class="block text-xs font-medium text-slate-500">نام و نام خانوادگی</span>
              <strong class="mt-1 block text-sm font-semibold text-slate-800">{{ fullName() }}</strong>
            </div>

            <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span class="block text-xs font-medium text-slate-500">شماره همراه</span>
              <strong class="mt-1 block text-sm font-semibold text-slate-800 dir-ltr text-right">
                {{ (u.phoneNumber || '---') | persianDigits }}
              </strong>
            </div>

            <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span class="block text-xs font-medium text-slate-500">نقش سیستم</span>
              <strong class="mt-1 block text-sm font-semibold text-slate-800">{{ roleTitle() }}</strong>
            </div>

            <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <span class="block text-xs font-medium text-slate-500">شناسه مرکز / سازمان</span>
              <strong class="mt-1 block text-sm font-mono text-slate-800">{{ u.organizationId || 'ثبت نشده' }}</strong>
            </div>
          </div>

          <!-- Informational Notice -->
          <div class="rounded-xl bg-amber-50 p-4 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <span class="text-base shrink-0">ℹ️</span>
            <div>
              <strong class="font-bold block mb-0.5">ویرایش اطلاعات پروفایل:</strong>
              جهت تغییر نام، شماره تلفن یا مشخصات شغلی، لطفاً با مدیر مرکز یا واحد پشتیبانی سیستم تماس بگیرید.
            </div>
          </div>
        </div>
      } @else {
        <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs space-y-3">
          <p class="text-sm text-slate-600">اطلاعات کاربری یافت نشد.</p>
          <button (click)="loadProfile()" class="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-medium">
            تلاش مجدد
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly user = signal<CurrentUserDto | null>(this.authService.userDetails());
  readonly isLoading = signal<boolean>(!this.user());

  readonly fullName = computed(() => {
    const u = this.user();
    if (!u) return 'کارمند';
    const first = u.firstName ? u.firstName.trim() : '';
    const last = u.lastName ? u.lastName.trim() : '';
    const full = `${first} ${last}`.trim();
    return full || 'کارمند';
  });

  readonly avatarInitial = computed(() => {
    const name = this.fullName();
    return name ? name.charAt(0) : 'ک';
  });

  readonly roleTitle = computed(() => {
    const roles = this.user()?.roles;
    if (roles && roles.includes('Employee')) return 'کارمند سازمان';
    if (roles && roles.includes('CenterManager')) return 'مدیر مرکز';
    if (roles && roles.includes('SystemAdmin')) return 'مدیر سیستم';
    return 'کارمند';
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.authService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
