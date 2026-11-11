import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { AccountInfoCardComponent } from '../../../../shared/components/account-info-card/account-info-card.component';
import { LogoutButtonComponent } from '../../../../shared/components/logout-button/logout-button.component';

@Component({
  selector: 'app-employee-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, AccountInfoCardComponent, LogoutButtonComponent],
  template: `
    <div class="space-y-6">
      <!-- Standardized Page Header -->
      <app-page-header
        title="تنظیمات حساب کاربری"
        subtitle="اطلاعات حساب، مشخصات شغلی و امنیت ورود به سامانه"
      ></app-page-header>

      <!-- Settings Cards Container -->
      <div class="space-y-5">
        <!-- Account & Profile Information (shared card across the three dashboards) -->
        <app-account-info-card
          title="پروفایل و اطلاعات کاربری"
          subtitle="اطلاعات حساب کارمند و مشخصات ثبت شده در سامانه آریا"
          [showProfileLink]="true"
          profileRoute="/employee/profile"
          profileLinkLabel="مشاهده پروفایل کامل"
        ></app-account-info-card>

        <!-- Quick Access to Profile Details Banner -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">مشاهده مشخصات شغلی و پرسنلی</h3>
                <p class="text-xs text-slate-500 mt-0.5">شناسه کاربری، مرکز سازمانی و جزئیات دسترسی</p>
              </div>
            </div>
            <a
              routerLink="/employee/profile"
              class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              <span>مشاهده و بررسی پروفایل</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotate-180">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Session & Application Details Card -->
        <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-lg">
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

  ngOnInit(): void {
    if (!this.authService.userDetails() && this.authService.isAuthenticated()) {
      this.authService.getCurrentUser().subscribe();
    }
  }
}
