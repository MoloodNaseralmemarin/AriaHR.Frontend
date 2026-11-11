import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { AuthService } from '../../../../core/auth/auth.service';
import { AccountInfoCardComponent } from '../../../../shared/components/account-info-card/account-info-card.component';
import { LogoutButtonComponent } from '../../../../shared/components/logout-button/logout-button.component';

@Component({
  selector: 'app-employee-settings',
  standalone: true,
  imports: [AccountInfoCardComponent, LogoutButtonComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-slate-900 sm:text-2xl">تنظیمات حساب کاربری</h1>
        <p class="mt-1 text-xs text-slate-500 sm:text-sm">اطلاعات حساب، نشست کاری و امنیت ورود به سامانه</p>
      </div>

      <!-- Settings Cards Container -->
      <div class="space-y-4">
        <!-- Account & Profile Information (shared card, identical across the three dashboards) -->
        <app-account-info-card
          subtitle="اطلاعات حساب کارمند و پروفایل ثبت شده در سازمان"
          [showProfileLink]="true"
          profileRoute="/employee/profile"
        ></app-account-info-card>

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

        <!-- Session Action Card (shared logout control) -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-lg text-rose-600">
              🚪
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">خروج از حساب کاربری</h2>
              <p class="mt-0.5 text-xs text-slate-500">پایان نشست فعلی در این مرورگر</p>
            </div>
          </div>

          <app-logout-button></app-logout-button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeSettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);

  /**
   * The shared account card reads AuthService signals, so a deep link (or a hard refresh)
   * on this page has no /api/auth/me payload yet and would render placeholder values.
   * Refresh the profile once, the same way the center-manager sidebar does.
   */
  ngOnInit(): void {
    if (!this.authService.userDetails() && this.authService.isAuthenticated()) {
      this.authService.getCurrentUser().subscribe();
    }
  }
}
