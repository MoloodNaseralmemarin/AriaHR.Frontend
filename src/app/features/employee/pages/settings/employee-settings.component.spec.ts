import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';
import { EmployeeSettingsComponent } from './employee-settings.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';

describe('EmployeeSettingsComponent', () => {
  let component: EmployeeSettingsComponent;
  let mockAuthService: any;
  let injector: Injector;

  const mockUser: CurrentUserDto = {
    id: 'user-1',
    firstName: 'نیما',
    lastName: 'صادقی',
    phoneNumber: '09120001122',
    roles: ['Employee'],
    organizationId: 'org-1',
    organizationName: 'کلینیک پارس',
  };

  const createComponent = (details: CurrentUserDto | null, authenticated: boolean): void => {
    mockAuthService = {
      userDetails: vi.fn().mockReturnValue(details),
      isAuthenticated: vi.fn().mockReturnValue(authenticated),
      getCurrentUser: vi.fn().mockReturnValue(of(mockUser)),
    };

    injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      component = new EmployeeSettingsComponent();
    });
  };

  beforeEach(() => {
    createComponent(null, true);
  });

  it('should refresh the profile on a deep link so the shared account card has data', () => {
    component.ngOnInit();

    expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should not refetch the profile when the user details are already cached', () => {
    createComponent(mockUser, true);

    component.ngOnInit();

    expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should not call the API when there is no active session', () => {
    createComponent(null, false);

    component.ngOnInit();

    expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled();
  });
});
