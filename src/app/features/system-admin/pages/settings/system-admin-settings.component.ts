import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';

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
        <button type="button" class="logout-btn" (click)="logout()">
          <span>خروج از حساب کاربری</span>
          <span class="logout-icon">↵</span>
        </button>
      </div>
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
        cursor: pointer;
      }
      .settings-card button span {
        color: #94a3b8;
        font-size: 22px;
      }
      .settings-card button.logout-btn {
        color: #e11d48;
      }
      .settings-card button.logout-btn .logout-icon {
        color: #e11d48;
        font-size: 18px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminSettingsComponent {
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
