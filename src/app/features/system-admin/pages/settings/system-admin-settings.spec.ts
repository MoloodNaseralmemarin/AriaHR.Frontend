import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SystemAdminSettingsComponent } from './system-admin-settings.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';

describe('SystemAdminSettingsComponent', () => {
  let component: SystemAdminSettingsComponent;
  let mockAuthService: any;
  let injector: Injector;

  const mockUser: CurrentUserDto = {
    id: 'user-123',
    firstName: 'امیر',
    lastName: 'رضایی',
    phoneNumber: '09123456789',
    roles: ['SystemAdmin'],
    organizationId: null,
  };

  beforeEach(() => {
    mockAuthService = {
      userDetails: vi.fn().mockReturnValue(mockUser),
      getCurrentUser: vi.fn().mockReturnValue(of(mockUser)),
      logout: vi.fn(),
    };

    injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminSettingsComponent();
    });
  });

  it('should initialize and load administrator details on init', () => {
    component.ngOnInit();

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.adminName()).toBe('امیر رضایی');
    expect(component.adminPhone()).toBe('09123456789');
    expect(component.adminRole()).toBe('مدیر سیستم (SystemAdmin)');
  });

  it('should handle profile load error gracefully', () => {
    mockAuthService.getCurrentUser.mockReturnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);
    expect(component.errorMessage()).toContain('خطا در دریافت اطلاعات');
  });

  it('should open and close logout confirmation modal', () => {
    expect(component.showLogoutModal()).toBe(false);

    component.promptLogout();
    expect(component.showLogoutModal()).toBe(true);

    component.cancelLogout();
    expect(component.showLogoutModal()).toBe(false);
  });

  it('should execute logout via AuthService when confirmed', () => {
    component.promptLogout();
    expect(component.showLogoutModal()).toBe(true);

    component.confirmLogout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(component.showLogoutModal()).toBe(false);
  });
});
