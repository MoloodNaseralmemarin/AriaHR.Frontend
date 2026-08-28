import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService, LogoutResponse } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-system-admin-settings',
  standalone: true,
  template: `
    <section dir="rtl" class="space-y-5">
      <div>
        <p class="eyebrow">حساب کاربری</p>
        <h1>تنظیمات</h1>
        <p class="subtitle">مدیریت تنظیمات سامانه و حساب مدیر سیستم</p>
      </div>

      @if (errorMessage()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {{ errorMessage() }}
        </div>
      }

      <div class="settings-card">
        <div class="profile">
          <div class="avatar">م</div>
          <div>
            <strong>مدیر سیستم</strong>
            <span>دسترسی کامل سامانه</span>
          </div>
        </div>
        <button type="button">اطلاعات حساب کاربری <span>‹</span></button>
        <button type="button">اعلان‌ها و پیام‌ها <span>‹</span></button>
        <button type="button">امنیت و رمز عبور <span>‹</span></button>
        <button type="button" class="logout-btn" (click)="showLogoutConfirm.set(true)">
          خروج از حساب کاربری <span>‹</span>
        </button>
      </div>

      @if (showLogoutConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 class="text-base font-bold text-slate-800">خروج از حساب</h2>
            <p class="text-sm text-slate-600">
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خارج شوید؟
            </p>
            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                [disabled]="authService.isLoggingOut()"
                (click)="showLogoutConfirm.set(false)"
              >
                انصراف
              </button>
              <button
                type="button"
                class="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                [disabled]="authService.isLoggingOut()"
                (click)="onConfirmLogout()"
              >
                @if (authService.isLoggingOut()) {
                  <span>در حال خروج...</span>
                } @else {
                  <span>خروج از حساب</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .eyebrow {
        color: #2563eb;
        font-size: 12px;
      }
      .subtitle {
        margin-top: 5px;
        color: #64748b;
        font-size: 12px;
      }
      h1 {
        margin-top: 4px;
        color: #0f172a;
        font-size: 24px;
        font-weight: 700;
      }
      .settings-card {
        overflow: hidden;
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        background: white;
      }
      .profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px;
      }
      .avatar {
        display: grid;
        width: 45px;
        height: 45px;
        place-items: center;
        border-radius: 14px;
        background: #dbeafe;
        color: #2563eb;
        font-weight: 700;
      }
      .profile strong,
      .profile span {
        display: block;
      }
      .profile strong {
        color: #1e293b;
        font-size: 13px;
      }
      .profile span {
        margin-top: 4px;
        color: #94a3b8;
        font-size: 10px;
      }
      .settings-card button {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid #f1f5f9;
        background: white;
        padding: 16px;
        color: #334155;
        font-family: inherit;
        font-size: 12px;
        text-align: right;
      }
      .settings-card button span {
        color: #94a3b8;
        font-size: 22px;
      }
      .settings-card button.logout-btn {
        color: #dc2626;
      }
      .settings-card button.logout-btn span {
        color: #fca5a5;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminSettingsComponent {
  readonly authService = inject(AuthService);
  readonly showLogoutConfirm = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onConfirmLogout(): void {
    this.errorMessage.set(null);
    this.authService.logout().subscribe({
      next: (res: LogoutResponse) => {
        if (!res.success && res.message) {
          this.errorMessage.set(res.message);
        }
        this.showLogoutConfirm.set(false);
      },
    });
  }
}
