import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { PersianDigitsPipe } from '../../pipes/persian-digits.pipe';

/**
 * Shared account / profile card rendered by the Settings page of all three dashboards
 * (System Admin, Center Manager, Employee), so the same personal information is shown
 * with the same labels, ordering and styling everywhere.
 *
 * Values are read from AuthService signals (`userDetails` with a `currentUser` fallback),
 * which keeps profile loading in a single place instead of one implementation per dashboard.
 */
@Component({
  selector: 'app-account-info-card',
  standalone: true,
  imports: [CommonModule, RouterLink, PersianDigitsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
            {{ icon }}
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900">{{ title }}</h2>
            <p class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
          </div>
        </div>

        <a
          *ngIf="showProfileLink"
          [routerLink]="profileRoute"
          class="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
        >
          {{ profileLinkLabel }}
        </a>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2" [ngClass]="gridColumnsClass">
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span class="mb-1 block font-medium text-slate-500">نام و نام خانوادگی</span>
          <strong class="text-sm font-bold text-slate-900">{{ fullName() }}</strong>
        </div>

        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span class="mb-1 block font-medium text-slate-500">شماره همراه</span>
          <strong class="dir-ltr block text-right text-sm font-bold text-slate-900">
            {{ phone() | persianDigits }}
          </strong>
        </div>

        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span class="mb-1 block font-medium text-slate-500">نقش و سطح دسترسی</span>
          <strong
            class="mt-0.5 inline-block rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"
          >
            {{ roleTitle() }}
          </strong>
        </div>

        <div *ngIf="showCenter" class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span class="mb-1 block font-medium text-slate-500">مرکز / سازمان</span>
          <strong class="text-sm font-bold text-slate-900">{{ centerName() }}</strong>
        </div>

        <div *ngIf="showAuthMethod" class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span class="mb-1 block font-medium text-slate-500">روش احراز هویت</span>
          <strong
            class="mt-0.5 inline-block rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
          >
            رمز یکبار مصرف پیامکی (OTP)
          </strong>
        </div>
      </div>
    </section>
  `,
})
export class AccountInfoCardComponent {
  @Input() title = 'حساب کاربری و امنیت';
  @Input() subtitle = 'مشخصات حساب فعال و نحوه دسترسی به سامانه';
  @Input() icon = '👤';
  @Input() showCenter = true;
  @Input() showAuthMethod = true;
  @Input() showProfileLink = false;
  @Input() profileRoute = '/employee/profile';
  @Input() profileLinkLabel = 'مشاهده پروفایل کامل';
  @Input() columns: 'two' | 'three' = 'two';

  private readonly authService = inject(AuthService);

  get gridColumnsClass(): string {
    return this.columns === 'three' ? 'lg:grid-cols-3' : '';
  }

  readonly fullName = computed(() => {
    const details = this.authService.userDetails();
    const fromDetails = [details?.firstName, details?.lastName]
      .filter((part) => !!part && !!part.trim())
      .join(' ')
      .trim();
    if (fromDetails) {
      return fromDetails;
    }

    const full = this.authService.currentUser()?.fullName?.trim();
    return full || '—';
  });

  readonly phone = computed(() => {
    const details = this.authService.userDetails();
    return details?.phoneNumber || this.authService.currentUser()?.mobileNumber || '—';
  });

  readonly roleTitle = computed(() => {
    const roles = this.authService.userDetails()?.roles || this.authService.currentUser()?.roles;
    if (!roles || roles.length === 0) {
      return 'کاربر سازمان';
    }
    const primary = roles[0];
    if (primary === 'SystemAdmin') {
      return 'مدیر سیستم (SystemAdmin)';
    }
    if (primary === 'CenterManager') {
      return 'مدیر مرکز (CenterManager)';
    }
    if (primary === 'Employee') {
      return 'کارمند (Employee)';
    }
    return roles.join(', ');
  });

  readonly centerName = computed(() => {
    const organization = this.authService.userDetails()?.organizationName;
    return organization && organization.trim() ? organization.trim() : 'تعیین نشده';
  });
}
