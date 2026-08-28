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
    <div dir="rtl" lang="fa" class="flex min-h-screen bg-slate-50 text-slate-800">
      <!-- Desktop Sidebar -->
      <aside class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-slate-200 bg-white md:flex">
        <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            E
          </div>
          <div>
            <p class="text-sm font-bold text-slate-800">آریا اچ‌آر</p>
            <p class="text-xs text-slate-400">پنل کارمند</p>
          </div>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="bg-blue-50 text-blue-700 font-bold"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <span class="text-lg leading-none">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="border-t border-slate-100 p-4">
          <div class="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div class="flex items-center gap-2 min-w-0">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {{ userInitial() }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-700">{{ userName() }}</p>
                <p class="truncate text-[11px] text-slate-400">کارمند</p>
              </div>
            </div>
            <button
              type="button"
              (click)="onLogout()"
              class="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50"
              title="خروج"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Container -->
      <div class="flex min-h-screen w-full flex-1 flex-col">
        <!-- Mobile Header -->
        <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm md:hidden">
          <span class="text-sm font-bold text-slate-800">پنل کارمند - آریا اچ‌آر</span>
          <button
            type="button"
            (click)="onLogout()"
            class="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <span>خروج</span>
          </button>
        </header>

        <main class="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Mobile Bottom Nav -->
      <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden" aria-label="ناوبری اصلی">
        <div class="mx-auto grid h-[64px] max-w-lg grid-cols-4 px-2">
          <a routerLink="/employee/dashboard" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-lg">⌂</span><span>خانه</span>
          </a>
          <a routerLink="/employee/attendance" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-lg">⏱</span><span>تردد</span>
          </a>
          <a routerLink="/employee/leaves" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-lg">🌴</span><span>مرخصی</span>
          </a>
          <a routerLink="/employee/profile" routerLinkActive="text-blue-600 font-bold" class="flex flex-col items-center justify-center text-xs text-slate-500">
            <span class="text-lg">👤</span><span>پروفایل</span>
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
    { label: 'مرخصی‌ها', route: '/employee/leaves', icon: '🌴' },
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
