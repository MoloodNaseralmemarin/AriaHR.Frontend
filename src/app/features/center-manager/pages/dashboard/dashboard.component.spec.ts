import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthUserDto, CurrentUserDto } from '../../../../core/auth/auth.models';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { CenterManagerDashboardService } from '../../services/center-manager-dashboard.service';
import { CenterManagerDashboardDto } from '../../models/center-manager-dashboard.dto';

describe('Center Manager DashboardComponent', () => {
  const sampleUser: CurrentUserDto = {
    id: '12345678-1234-1234-1234-1234567890ab',
    firstName: 'محمد',
    lastName: 'رضایی',
    phoneNumber: '09123456789',
    roles: ['CenterManager'],
    organizationId: '87654321-4321-4321-4321-ba0987654321',
    organizationName: 'مرکز تخصصی پارس',
  };

  const sampleMetrics: CenterManagerDashboardDto = {
    activeEmployeesCount: 10,
    presentTodayCount: 8,
    absentTodayCount: 1,
    approvedLeaveTodayCount: 1,
    lateArrivalsTodayCount: 0,
  };

  let userDetailsSignal: ReturnType<typeof signal<CurrentUserDto | null>>;
  let currentUserSignal: ReturnType<typeof signal<AuthUserDto | null>>;
  let mockAuthService: {
    userDetails: typeof userDetailsSignal;
    currentUser: typeof currentUserSignal;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let mockPersianDateService: {
    getTodayFormatted: ReturnType<typeof vi.fn>;
  };
  let mockDashboardService: {
    getDashboardMetrics: ReturnType<typeof vi.fn>;
  };
  let injector: Injector;

  beforeEach(() => {
    userDetailsSignal = signal<CurrentUserDto | null>(null);
    currentUserSignal = signal<AuthUserDto | null>(null);

    mockAuthService = {
      userDetails: userDetailsSignal,
      currentUser: currentUserSignal,
      getCurrentUser: vi.fn().mockReturnValue(of(sampleUser)),
    };

    mockPersianDateService = {
      getTodayFormatted: vi.fn().mockReturnValue('یکشنبه ۴ آبان ۱۴۰۴'),
    };

    mockDashboardService = {
      getDashboardMetrics: vi.fn().mockReturnValue(of(sampleMetrics)),
    };

    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PersianDateService, useValue: mockPersianDateService },
        { provide: CenterManagerDashboardService, useValue: mockDashboardService },
      ],
    });
  });

  it('should initialize component, call authService and fetch metrics on init', () => {
    runInInjectionContext(injector, () => {
      const component = new DashboardComponent();
      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getDashboardMetrics).toHaveBeenCalledTimes(1);
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.metrics()).toEqual(sampleMetrics);
    });
  });

  it('should handle dashboard service error and present Persian error message', () => {
    mockDashboardService.getDashboardMetrics.mockReturnValue(throwError(() => new Error('API Error')));

    runInInjectionContext(injector, () => {
      const component = new DashboardComponent();
      component.ngOnInit();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('خطا در دریافت اطلاعات داشبورد. لطفاً دوباره تلاش کنید.');
      expect(component.metrics()).toBeNull();
    });
  });

  it('should allow retrying dashboard metrics fetch on loadDashboardMetrics call', () => {
    mockDashboardService.getDashboardMetrics
      .mockReturnValueOnce(throwError(() => new Error('First failure')))
      .mockReturnValueOnce(of(sampleMetrics));

    runInInjectionContext(injector, () => {
      const component = new DashboardComponent();
      component.ngOnInit();
      expect(component.errorMessage()).not.toBeNull();

      component.loadDashboardMetrics();
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBeNull();
      expect(component.metrics()).toEqual(sampleMetrics);
    });
  });

  it('should display full name from userDetails without hardcoded prefixes', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set(sampleUser);
      const component = new DashboardComponent();

      expect(component.managerName).toBe('محمد رضایی');
    });
  });

  it('should display actual center name from userDetails.organizationName', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set(sampleUser);
      const component = new DashboardComponent();

      expect(component.centerName).toBe('مرکز تخصصی پارس');
    });
  });

  it('should fallback centerName to "تعیین نشده" when organizationName is null, undefined, or whitespace', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set({
        ...sampleUser,
        organizationName: null,
      });
      const componentNull = new DashboardComponent();
      expect(componentNull.centerName).toBe('تعیین نشده');

      userDetailsSignal.set({
        ...sampleUser,
        organizationName: '   ',
      });
      const componentSpace = new DashboardComponent();
      expect(componentSpace.centerName).toBe('تعیین نشده');

      userDetailsSignal.set(null);
      const componentNoUser = new DashboardComponent();
      expect(componentNoUser.centerName).toBe('تعیین نشده');
    });
  });

  it('should fallback to currentUser fullName if userDetails is null', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set(null);
      currentUserSignal.set({
        fullName: 'علی محمدی',
      });
      const component = new DashboardComponent();

      expect(component.managerName).toBe('علی محمدی');
    });
  });

  it('should fallback to neutral string if no user info is available', () => {
    runInInjectionContext(injector, () => {
      userDetailsSignal.set(null);
      currentUserSignal.set(null);
      const component = new DashboardComponent();

      expect(component.managerName).toBe('مدیر مرکز');
    });
  });

  it('should handle error from getCurrentUser gracefully', () => {
    mockAuthService.getCurrentUser.mockReturnValue(throwError(() => new Error('API error')));

    runInInjectionContext(injector, () => {
      const component = new DashboardComponent();
      component.ngOnInit();

      expect(component.managerName).toBe('مدیر مرکز');
    });
  });

  it('should display today Persian date using PersianDateService', () => {
    runInInjectionContext(injector, () => {
      const component = new DashboardComponent();

      expect(component.persianDate).toBe('یکشنبه ۴ آبان ۱۴۰۴');
    });
  });
});
