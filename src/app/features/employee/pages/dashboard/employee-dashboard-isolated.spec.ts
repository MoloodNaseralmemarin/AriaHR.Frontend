import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EmployeeDashboardComponent } from './employee-dashboard.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto, AuthUserDto } from '../../../../core/auth/auth.models';

describe('EmployeeDashboardComponent (Isolated Tests)', () => {
  let userDetailsSignal: ReturnType<typeof signal<CurrentUserDto | null>>;
  let currentUserSignal: ReturnType<typeof signal<AuthUserDto | null>>;
  let mockAuthService: {
    userDetails: typeof userDetailsSignal;
    currentUser: typeof currentUserSignal;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let injector: Injector;

  beforeEach(() => {
    userDetailsSignal = signal<CurrentUserDto | null>(null);
    currentUserSignal = signal<AuthUserDto | null>(null);

    mockAuthService = {
      userDetails: userDetailsSignal,
      currentUser: currentUserSignal,
      getCurrentUser: vi.fn().mockReturnValue(of(null)),
    };

    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it('should initialize and call getCurrentUser on ngOnInit', () => {
    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.isLoadingUser()).toBe(false);
    });
  });

  it('should compute employee full name from userDetails (firstName + lastName)', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set({
        id: 'emp-123',
        firstName: 'علی',
        lastName: 'رضایی',
        phoneNumber: '09121112233',
        roles: ['Employee'],
        organizationId: 'org-1',
      });

      const component = new EmployeeDashboardComponent();
      expect(component.employeeName()).toBe('علی رضایی');
    });
  });

  it('should compute employee name from AuthUserDto.fullName if userDetails is missing', () => {
    runInInjectionContext(injector, () => {
      currentUserSignal.set({
        id: 'emp-123',
        fullName: 'مریم احمدی',
        roles: ['Employee'],
      });

      const component = new EmployeeDashboardComponent();
      expect(component.employeeName()).toBe('مریم احمدی');
    });
  });

  it('should fallback to "کارمند" when all name properties are null or empty', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set({
        id: 'emp-123',
        firstName: '',
        lastName: '',
        phoneNumber: '09121112233',
        roles: ['Employee'],
        organizationId: 'org-1',
      });

      const component = new EmployeeDashboardComponent();
      expect(component.employeeName()).toBe('کارمند');
    });
  });

  it('should handle error when getCurrentUser fails without crashing and set loading to false', () => {
    mockAuthService.getCurrentUser.mockReturnValue(throwError(() => new Error('API Error')));

    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(component.isLoadingUser()).toBe(false);
      expect(component.employeeName()).toBe('کارمند');
    });
  });
});
