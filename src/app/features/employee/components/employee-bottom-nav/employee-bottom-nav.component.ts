import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../notifications/services/notification.service';
import { MobileNavDrawerComponent, MobileDrawerNavItem } from '../../../../shared/components/mobile-nav-drawer/mobile-nav-drawer.component';

interface BottomNavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-employee-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MobileNavDrawerComponent],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur md:hidden"
    >
      <a
        *ngFor="let item of primaryItems()"
        [routerLink]="item.route"
        routerLinkActive="text-blue-600 font-semibold"
        class="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-slate-500 transition-colors"
      >
        <span class="relative flex h-5 w-5 items-center justify-center">
          <svg *ngIf="item.icon === 'dashboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
          <svg *ngIf="item.icon === 'attendance'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          <svg *ngIf="item.icon === 'leave'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <svg *ngIf="item.icon === 'notifications'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

          <span
            *ngIf="item.badge && item.badge > 0"
            class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white ring-2 ring-white"
          >
            {{ item.badge }}
          </span>
        </span>
        {{ item.label }}
      </a>

      <!-- 5th Item: "More" Menu Toggle -->
      <button
        type="button"
        (click)="openMoreDrawer()"
        class="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 cursor-pointer"
        aria-label="سایر بخش‌ها"
      >
        <span class="relative flex h-5 w-5 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </span>
        <span>بیشتر</span>
      </button>
    </nav>

    <!-- Drawer with remaining sections for Employee -->
    <app-mobile-nav-drawer
      [isOpen]="isMoreOpen()"
      title="منوی کارمند"
      [items]="drawerItems()"
      (close)="closeMoreDrawer()"
    ></app-mobile-nav-drawer>
  `,
})
export class EmployeeBottomNavComponent {
  private readonly notificationService = inject(NotificationService);

  readonly isMoreOpen = signal(false);
  readonly unreadCount = this.notificationService.unreadCount;

  readonly primaryItems = computed<BottomNavItem[]>(() => [
    { label: 'داشبورد', route: '/employee/dashboard', icon: 'dashboard' },
    { label: 'حضور', route: '/employee/attendance', icon: 'attendance' },
    { label: 'مرخصی', route: '/employee/leave-requests', icon: 'leave' },
    { label: 'اعلان‌ها', route: '/employee/notifications', icon: 'notifications', badge: this.unreadCount() },
  ]);

  readonly drawerItems = computed<MobileDrawerNavItem[]>(() => [
    { label: 'تنظیمات حساب', route: '/employee/settings', icon: 'settings' },
    { label: 'پروفایل من', route: '/employee/profile', icon: 'profile' },
  ]);

  openMoreDrawer(): void {
    this.isMoreOpen.set(true);
  }

  closeMoreDrawer(): void {
    this.isMoreOpen.set(false);
  }
}
