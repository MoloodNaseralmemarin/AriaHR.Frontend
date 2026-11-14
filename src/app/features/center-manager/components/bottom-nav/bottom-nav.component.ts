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
  selector: 'app-bottom-nav',
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
          <svg *ngIf="item.icon === 'employees'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <svg *ngIf="item.icon === 'attendance'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <svg *ngIf="item.icon === 'shifts'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>

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
          <span
            *ngIf="moreUnreadBadge() > 0"
            class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white ring-2 ring-white"
          >
            {{ moreUnreadBadge() }}
          </span>
        </span>
        <span>بیشتر</span>
      </button>
    </nav>

    <!-- Drawer with remaining sections for Center Manager -->
    <app-mobile-nav-drawer
      [isOpen]="isMoreOpen()"
      title="منوی مدیر مرکز"
      [items]="drawerItems()"
      (close)="closeMoreDrawer()"
    ></app-mobile-nav-drawer>
  `,
})
export class BottomNavComponent {
  private readonly notificationService = inject(NotificationService);

  readonly isMoreOpen = signal(false);
  readonly unreadCount = this.notificationService.unreadCount;

  readonly primaryItems = computed<BottomNavItem[]>(() => [
    { label: 'داشبورد', route: '/center-manager/dashboard', icon: 'dashboard' },
    { label: 'کارکنان', route: '/center-manager/employees', icon: 'employees' },
    { label: 'حضور', route: '/center-manager/attendance', icon: 'attendance' },
    { label: 'شیفت‌ها', route: '/center-manager/shifts', icon: 'shifts' },
  ]);

  readonly moreUnreadBadge = computed(() => {
    return this.unreadCount();
  });

  readonly drawerItems = computed<MobileDrawerNavItem[]>(() => [
    { label: 'درخواست‌های مرخصی', route: '/center-manager/leave-requests', icon: 'leave' },
    { label: 'دسته‌بندی‌های مرخصی', route: '/center-manager/leave-categories', icon: 'leave-categories' },
    { label: 'محل کار و محدوده', route: '/center-manager/work-locations/create', icon: 'work-location' },
    { label: 'گزارش‌ها', route: '/center-manager/reports', icon: 'reports' },
    { label: 'اعلان‌ها', route: '/center-manager/notifications', icon: 'notifications', badge: this.unreadCount() },
    { label: 'تنظیمات مرکز', route: '/center-manager/settings', icon: 'settings' },
  ]);

  openMoreDrawer(): void {
    this.isMoreOpen.set(true);
  }

  closeMoreDrawer(): void {
    this.isMoreOpen.set(false);
  }
}
