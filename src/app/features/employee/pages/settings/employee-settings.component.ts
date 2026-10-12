import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../core/auth/auth.service';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-employee-settings',
  standalone: true,
  imports: [CommonModule, PersianDigitsPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">تنظیمات حساب کاربری</h1>
        <p class="mt-1 text-xs text-slate-500 sm:text-sm">مدیریت نشست کاری، امنیت و اطلاعات فنی حساب</p>
      </div>

      <!-- Settings Cards Container -->
      <div class="space-y-4">
        <!-- Security & Account Info Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-base">
              🔒
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900">امنیت و نحوه ورود</h2>
              <p class="text-[11px] text-slate-500">احراز هویت و ورود یکبار مصرف به سیستم</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <span class="block text-slate-500 mb-1">روش ورود به سامانه</span>
              <strong class="font-bold text-slate-800">رمز یکبار مصرف پیامکی (OTP)</strong>
            </div>

            <div class="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <span class="block text-slate-500 mb-1">شماره همراه تایید شده</span>
              <strong class="font-bold text-slate-800 dir-ltr text-right">
                {{ (userPhone() || '---') | persianDigits }}
              </strong>
            </div>
          </div>
        </div>

        <!-- Session & Application Details Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-base">
              💻
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900">اطلاعات نشست فعلی</h2>
              <p class="text-[11px] text-slate-500">مشخصات نسخه برنامه و دستگاه فعال</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <span class="block text-slate-500 mb-1">نسخه اپلیکیشن</span>
              <strong class="font-mono text-slate-800">AriaHR v1.0.0 (Production)</strong>
            </div>

            <div class="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <span class="block text-slate-500 mb-1">زبان و جهت رابط کاربری</span>
              <strong class="font-bold text-slate-800">فارسی (راست به چپ - RTL)</strong>
            </div>
          </div>
        </div>

        <!-- Actions Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex items-center justify-between gap-4">
          <div>
            <h3 class="text-xs font-bold text-slate-900">خروج از حساب کاربری</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">پایان نشست فعلی در این مرورگر</p>
          </div>

          <button
            type="button"
            (click)="onLogout()"
            class="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition cursor-pointer"
          >
            خروج از حساب
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeSettingsComponent {
  private readonly authService = inject(AuthService);

  readonly userPhone = computed(() => {
    return this.authService.userDetails()?.phoneNumber || this.authService.currentUser()?.mobileNumber || '';
  });

  onLogout(): void {
    this.authService.logout();
  }
}
