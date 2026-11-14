import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';

import { SystemAdminBottomNavComponent } from './system-admin-bottom-nav.component';
import { NotificationService } from '../../../notifications/services/notification.service';

describe('SystemAdminBottomNavComponent (isolated)', () => {
  let component: SystemAdminBottomNavComponent;
  let unreadCountSignal: ReturnType<typeof signal<number>>;
  let mockNotificationService: {
    unreadCount: ReturnType<typeof signal<number>>;
  };

  beforeEach(() => {
    unreadCountSignal = signal<number>(1);

    mockNotificationService = {
      unreadCount: unreadCountSignal,
    };

    const injector = Injector.create({
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminBottomNavComponent();
    });
  });

  it('should initialize with 4 primary items', () => {
    expect(component.primaryItems().length).toBe(4);
    expect(component.primaryItems().map((i) => i.label)).toEqual([
      'داشبورد',
      'مراکز',
      'اعلان‌ها',
      'تنظیمات',
    ]);
  });

  it('should reflect unread notification badge on notifications item', () => {
    const notifItem = component.primaryItems().find((i) => i.icon === 'notifications');
    expect(notifItem?.badge).toBe(1);
  });

  it('should toggle more drawer open and close', () => {
    expect(component.isMoreOpen()).toBe(false);
    component.openMoreDrawer();
    expect(component.isMoreOpen()).toBe(true);
    component.closeMoreDrawer();
    expect(component.isMoreOpen()).toBe(false);
  });
});
