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
    };

    injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminSettingsComponent();
    });
  });

  it('should load the current administrator profile on init', () => {
    component.ngOnInit();

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  it('should fall back to the cached user details when the API returns null', () => {
    mockAuthService.getCurrentUser.mockReturnValue(of(null));

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
  });

  it('should report an error state when neither the API nor the cache has a user', () => {
    mockAuthService.getCurrentUser.mockReturnValue(of(null));
    mockAuthService.userDetails.mockReturnValue(null);

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);
    expect(component.errorMessage()).toContain('یافت نشد');
  });

  it('should handle profile load error gracefully', () => {
    mockAuthService.getCurrentUser.mockReturnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);
    expect(component.errorMessage()).toContain('خطا در دریافت اطلاعات');
  });

  it('should clear the error state when the profile is reloaded successfully', () => {
    mockAuthService.getCurrentUser.mockReturnValue(throwError(() => new Error('API Error')));
    component.ngOnInit();
    expect(component.hasError()).toBe(true);

    mockAuthService.getCurrentUser.mockReturnValue(of(mockUser));
    component.loadProfile();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });
});
