import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div dir="rtl" lang="fa" class="min-h-screen bg-slate-50 text-slate-800">
      <!-- Desktop & Mobile Header -->
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-xs">
              آ
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">آریا اچ‌آر</p>
              <p class="text-xs text-slate-500">پنل کارمند</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 sm:flex">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {{ userInitial() }}
              </div>
              <span class="text-xs font-semibold text-slate-700">{{ userName() }}</span>
            </div>

            <button
              type="button"
              (click)="onLogout()"
              class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer shadow-2xs"
              title="خروج از حساب"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Container (No sidebar spacing) -->
      <main class="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Mobile Nav -->
      <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden" aria-label="ناوبری اصلی">
        <div class="mx-auto grid h-[60px] max-w-lg grid-cols-4 px-2">
          <a routerLink="/employee/dashboard" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-base">⌂</span><span>داشبورد</span>
          </a>
          <a routerLink="/employee/attendance" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-base">⏱</span><span>تردد</span>
          </a>
          <a routerLink="/employee/leave" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-base">🌴</span><span>مرخصی</span>
          </a>
          <a routerLink="/employee/profile" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-base">👤</span><span>پروفایل</span>
          </a>
        </div>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly navItems: NavItem[] = [
    { label: 'داشبورد', route: '/employee/dashboard', icon: '⌂' },
    { label: 'پروفایل من', route: '/employee/profile', icon: '👤' },
    { label: 'حضور و غیاب', route: '/employee/attendance', icon: '⏱' },
    { label: 'مرخصی‌ها', route: '/employee/leave', icon: '🌴' },
    { label: 'درخواست‌ها', route: '/employee/requests', icon: '📝' },
    { label: 'اعلان‌ها', route: '/employee/notifications', icon: '🔔' },
    { label: 'تنظیمات', route: '/employee/settings', icon: '⚙' },
  ];

  readonly userName = computed(() => {
    const user = this.authService.userDetails();
    if (user && user.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    return 'کارمند';
  });

  readonly userInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0) : 'ک';
  });

  onLogout(): void {
    this.authService.logout();
  }
}
