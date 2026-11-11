import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { AccountInfoCardComponent } from './account-info-card.component';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUserDto, CurrentUserDto } from '../../../core/auth/auth.models';

describe('AccountInfoCardComponent', () => {
  let component: AccountInfoCardComponent;
  let mockAuthService: any;

  const userDetails: CurrentUserDto = {
    id: 'user-1',
    firstName: 'سارا',
    lastName: 'محمدی',
    phoneNumber: '09121234567',
    roles: ['CenterManager'],
    organizationId: 'org-1',
    organizationName: 'کلینیک پارس',
  };

  const createComponent = (details: CurrentUserDto | null, current: AuthUserDto | null = null): void => {
    mockAuthService = {
      userDetails: vi.fn().mockReturnValue(details),
      currentUser: vi.fn().mockReturnValue(current),
    };

    const injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      component = new AccountInfoCardComponent();
    });
  };

  beforeEach(() => {
    createComponent(userDetails);
  });

  it('should render the identity and center of the current user', () => {
    expect(component.fullName()).toBe('سارا محمدی');
    expect(component.phone()).toBe('09121234567');
    expect(component.centerName()).toBe('کلینیک پارس');
    expect(component.roleTitle()).toBe('مدیر مرکز (CenterManager)');
  });

  it('should map every known role to its Persian label', () => {
    createComponent({ ...userDetails, roles: ['SystemAdmin'] });
    expect(component.roleTitle()).toBe('مدیر سیستم (SystemAdmin)');

    createComponent({ ...userDetails, roles: ['CenterManager'] });
    expect(component.roleTitle()).toBe('مدیر مرکز (CenterManager)');

    createComponent({ ...userDetails, roles: ['Employee'] });
    expect(component.roleTitle()).toBe('کارمند (Employee)');

    createComponent({ ...userDetails, roles: ['Auditor'] });
    expect(component.roleTitle()).toBe('Auditor');
  });

  it('should fall back to the cached user when /api/auth/me has not been loaded', () => {
    createComponent(null, {
      id: 'user-2',
      fullName: 'نیما صادقی',
      mobileNumber: '09120001122',
      roles: ['Employee'],
    });

    expect(component.fullName()).toBe('نیما صادقی');
    expect(component.phone()).toBe('09120001122');
    expect(component.roleTitle()).toBe('کارمند (Employee)');
  });

  it('should render placeholders instead of empty values', () => {
    createComponent(null, null);

    expect(component.fullName()).toBe('—');
    expect(component.phone()).toBe('—');
    expect(component.centerName()).toBe('تعیین نشده');
    expect(component.roleTitle()).toBe('کاربر سازمان');
  });

  it('should trim partial names and ignore empty name parts', () => {
    createComponent({ ...userDetails, firstName: '  سارا ', lastName: '  ' });
    expect(component.fullName()).toBe('سارا');
  });

  it('should expose consistent defaults for every dashboard', () => {
    expect(component.title).toBe('حساب کاربری و امنیت');
    expect(component.showCenter).toBe(true);
    expect(component.showAuthMethod).toBe(true);
    expect(component.showProfileLink).toBe(false);
    expect(component.columns).toBe('two');
    expect(component.profileRoute).toBe('/employee/profile');
    expect(component.gridColumnsClass).toBe('');
  });

  it('should switch the grid to three columns when requested', () => {
    component.columns = 'three';
    expect(component.gridColumnsClass).toBe('lg:grid-cols-3');
  });
});
