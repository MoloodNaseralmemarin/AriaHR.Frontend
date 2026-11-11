import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';

import { BottomNavComponent } from './bottom-nav.component';
import { NotificationService } from '../../../notifications/services/notification.service';

describe('CenterManager BottomNavComponent (isolated)', () => {
  let component: BottomNavComponent;
  let unreadCountSignal: ReturnType<typeof signal<number>>;
  let mockNotificationService: {
    unreadCount: ReturnType<typeof signal<number>>;
  };

  beforeEach(() => {
    unreadCountSignal = signal<number>(2);

    mockNotificationService = {
      unreadCount: unreadCountSignal,
    };

    const injector = Injector.create({
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new BottomNavComponent();
    });
  });

  it('should initialize with 4 primary items', () => {
    expect(component.primaryItems().length).toBe(4);
    expect(component.primaryItems().map((i) => i.label)).toEqual([
      'داشبورد',
      'کارکنان',
      'حضور',
      'شیفت‌ها',
    ]);
  });

  it('should include leave requests, categories, workplace, reports, notifications and settings in drawerItems', () => {
    const items = component.drawerItems();
    const labels = items.map((i) => i.label);
    expect(labels).toContain('درخواست‌های مرخصی');
    expect(labels).toContain('دسته‌بندی‌های مرخصی');
    expect(labels).toContain('محل کار و محدوده');
    expect(labels).toContain('گزارش‌ها');
    expect(labels).toContain('اعلان‌ها');
    expect(labels).toContain('تنظیمات مرکز');
  });

  it('should reflect unread count badge in moreUnreadBadge and drawer items', () => {
    expect(component.moreUnreadBadge()).toBe(2);
    const notif = component.drawerItems().find((i) => i.icon === 'notifications');
    expect(notif?.badge).toBe(2);
  });

  it('should toggle more drawer open and close', () => {
    expect(component.isMoreOpen()).toBe(false);
    component.openMoreDrawer();
    expect(component.isMoreOpen()).toBe(true);
    component.closeMoreDrawer();
    expect(component.isMoreOpen()).toBe(false);
  });
});
