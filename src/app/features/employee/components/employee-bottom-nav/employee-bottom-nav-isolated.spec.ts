import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';

import { EmployeeBottomNavComponent } from './employee-bottom-nav.component';
import { NotificationService } from '../../../notifications/services/notification.service';

describe('Employee BottomNavComponent (isolated)', () => {
  let component: EmployeeBottomNavComponent;
  let unreadCountSignal: ReturnType<typeof signal<number>>;
  let mockNotificationService: {
    unreadCount: ReturnType<typeof signal<number>>;
  };

  beforeEach(() => {
    unreadCountSignal = signal<number>(5);

    mockNotificationService = {
      unreadCount: unreadCountSignal,
    };

    const injector = Injector.create({
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new EmployeeBottomNavComponent();
    });
  });

  it('should initialize with 4 primary items excluding My Profile', () => {
    expect(component.primaryItems().length).toBe(4);
    expect(component.primaryItems().map((i) => i.label)).toEqual([
      'داشبورد',
      'حضور',
      'مرخصی',
      'اعلان‌ها',
    ]);
  });

  it('should contain settings and profile in drawerItems', () => {
    const items = component.drawerItems();
    const labels = items.map((i) => i.label);
    expect(labels).toContain('تنظیمات حساب');
    expect(labels).toContain('پروفایل من');
  });

  it('should toggle more drawer open and close', () => {
    expect(component.isMoreOpen()).toBe(false);
    component.openMoreDrawer();
    expect(component.isMoreOpen()).toBe(true);
    component.closeMoreDrawer();
    expect(component.isMoreOpen()).toBe(false);
  });
});
