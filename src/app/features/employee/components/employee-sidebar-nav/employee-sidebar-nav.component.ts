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
  selector: 'app-employee-sidebar-nav',
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
          <p class="text-xs font-medium text-slate-400">پنل کارمند</p>
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
              <svg *ngIf="item.icon === 'profile'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <svg *ngIf="item.icon === 'attendance'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              <svg *ngIf="item.icon === 'leave'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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
              <p class="truncate text-[11px] text-slate-400">کارمند</p>
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
export class EmployeeSidebarNavComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly unreadCount = this.notificationService.unreadCount;

  readonly userName = computed(() => {
    const user = this.authService.userDetails();
    if (user && user.firstName) {
      return `${user.firstName.trim()} ${user.lastName ? user.lastName.trim() : ''}`.trim();
    }
    const cur = this.authService.currentUser();
    if (cur && cur.fullName) {
      return cur.fullName.trim();
    }
    return 'کارمند';
  });

  readonly avatarInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0) : 'ک';
  });

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'داشبورد', route: '/employee/dashboard', icon: 'dashboard' },
    { label: 'پروفایل من', route: '/employee/profile', icon: 'profile' },
    { label: 'تردد و حضور', route: '/employee/attendance', icon: 'attendance' },
    { label: 'مرخصی‌ها', route: '/employee/leave-requests', icon: 'leave' },
    { label: 'اعلان‌ها', route: '/employee/notifications', icon: 'notifications', badge: this.unreadCount() },
    { label: 'تنظیمات', route: '/employee/settings', icon: 'settings' },
  ]);

  onLogout(): void {
    this.authService.logout();
  }
}
