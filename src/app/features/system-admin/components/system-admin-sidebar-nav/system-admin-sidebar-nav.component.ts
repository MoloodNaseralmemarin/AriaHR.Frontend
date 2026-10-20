import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../notifications/services/notification.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-system-admin-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-slate-200 bg-white md:flex"
    >
      <div class="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
          A
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">آریا اچ‌آر</p>
          <p class="text-xs font-medium text-slate-400">مدیریت سیستم</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <a
          *ngFor="let item of navItems()"
          [routerLink]="item.route"
          routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-5 w-5 items-center justify-center">
              <svg *ngIf="item.icon === 'dashboard'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
              <svg *ngIf="item.icon === 'centers'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg>
              <svg *ngIf="item.icon === 'managers'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <svg *ngIf="item.icon === 'notifications'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <svg *ngIf="item.icon === 'settings'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <span>{{ item.label }}</span>
          </div>
          <span
            *ngIf="item.badge && item.badge > 0"
            class="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white"
          >
            {{ item.badge }}
          </span>
        </a>
      </nav>

      <div class="border-t border-slate-100 px-4 py-4 space-y-2">
        <div class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {{ avatarInitial() }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-slate-700">{{ userName() }}</p>
              <p class="truncate text-[11px] text-slate-400">مدیر کل سیستم</p>
            </div>
          </div>
          <button
            type="button"
            (click)="onLogout()"
            class="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50"
            title="خروج از حساب"
            aria-label="خروج از حساب"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class SystemAdminSidebarNavComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly unreadCount = this.notificationService.unreadCount;

  readonly userName = computed(() => {
    const user = this.authService.userDetails();
    if (user && user.firstName) {
      return `${user.firstName.trim()} ${user.lastName ? user.lastName.trim() : ''}`.trim();
    }
    return 'مدیر سیستم';
  });

  readonly avatarInitial = computed(() => {
    const user = this.authService.userDetails();
    if (user && user.firstName) {
      return user.firstName.trim().charAt(0);
    }
    return 'م';
  });

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'داشبورد', route: '/system-admin/dashboard', icon: 'dashboard' },
    { label: 'مراکز', route: '/system-admin/centers', icon: 'centers' },
    { label: 'مدیران', route: '/system-admin/managers', icon: 'managers' },
    { label: 'اعلان‌ها', route: '/system-admin/notifications', icon: 'notifications', badge: this.unreadCount() },
    { label: 'تنظیمات', route: '/system-admin/settings', icon: 'settings' },
  ]);

  onLogout(): void {
    this.authService.logout();
  }
}
