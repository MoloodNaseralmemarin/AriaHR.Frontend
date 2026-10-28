import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EmployeeDashboardComponent } from './employee-dashboard.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { LeaveRequestService } from '../../services/leave-request.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { CurrentUserDto, AuthUserDto } from '../../../../core/auth/auth.models';
import { TodayAttendanceDto } from '../../models/employee-attendance.models';
import { LeaveRequestDto } from '../../models/leave-request.model';

describe('EmployeeDashboardComponent (Isolated Tests)', () => {
  let userDetailsSignal: ReturnType<typeof signal<CurrentUserDto | null>>;
  let currentUserSignal: ReturnType<typeof signal<AuthUserDto | null>>;
  let mockAuthService: {
    userDetails: typeof userDetailsSignal;
    currentUser: typeof currentUserSignal;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let mockAttendanceService: {
    getTodayAttendance: ReturnType<typeof vi.fn>;
  };
  let mockLeaveRequestService: {
    getLeaveRequests: ReturnType<typeof vi.fn>;
  };
  let mockPersianDateService: {
    getTodayFormatted: ReturnType<typeof vi.fn>;
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

    mockAttendanceService = {
      getTodayAttendance: vi.fn().mockReturnValue(of({
        isCheckedIn: true,
        isCheckedOut: false,
        checkInTime: '08:00',
        checkOutTime: null,
        workDuration: '04:00',
        shift: { name: 'شیفت صبح', startTime: '08:00', endTime: '16:00' },
        status: 'checkedIn',
      } as TodayAttendanceDto)),
    };

    mockLeaveRequestService = {
      getLeaveRequests: vi.fn().mockReturnValue(of([
        {
          id: 'leave-1',
          leaveType: 'daily',
          startDate: '1403-02-10',
          durationText: '1 روز',
          reason: 'شخصی',
          status: 'pending',
          createdAt: '1403-02-09',
        } as LeaveRequestDto,
      ])),
    };

    mockPersianDateService = {
      getTodayFormatted: vi.fn().mockReturnValue('دوشنبه ۱۴ اردیبهشت ۱۴۰۳'),
    };

    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: LeaveRequestService, useValue: mockLeaveRequestService },
        { provide: PersianDateService, useValue: mockPersianDateService },
      ],
    });
  });

  it('should initialize and call APIs on ngOnInit', () => {
    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
      expect(mockLeaveRequestService.getLeaveRequests).toHaveBeenCalled();
      expect(component.isLoadingUser()).toBe(false);
      expect(component.isLoadingAttendance()).toBe(false);
      expect(component.isLoadingLeaves()).toBe(false);
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

  it('should handle API errors gracefully', () => {
    mockAttendanceService.getTodayAttendance.mockReturnValue(throwError(() => new Error('API Error')));
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(throwError(() => new Error('API Error')));

    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(component.attendanceError()).toBe(true);
      expect(component.isLoadingAttendance()).toBe(false);
      expect(component.isLoadingLeaves()).toBe(false);
    });
  });

  it('should return correct badge tones for attendance and leave request status', () => {
    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(component.attendanceStatusTone()).toBe('success');
      expect(component.getLeaveStatusTone('pending')).toBe('warning');
      expect(component.getLeaveStatusTone('approved')).toBe('success');
      expect(component.getLeaveStatusTone('rejected')).toBe('danger');
      expect(component.getLeaveStatusTone('cancelled')).toBe('neutral');
    });
  });

  it('should detect when attendance is blocked by daily leave and format message correctly', () => {
    mockAttendanceService.getTodayAttendance.mockReturnValue(of({
      isCheckedIn: false,
      isCheckedOut: false,
      isAttendanceBlockedByLeave: true,
      leaveRestrictionMessage: 'شما امروز در مرخصی هستید و امکان ثبت تردد ندارید.',
      activeLeave: {
        isHourly: false,
        startDate: '2026-03-30',
        endDate: '2026-03-30',
        leaveCategoryName: 'مرخصی استحقاقی',
      },
    } as TodayAttendanceDto));

    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(component.isAttendanceBlocked()).toBe(true);
      expect(component.leaveRestrictionBannerMessage()).toBe('شما امروز در مرخصی هستید و امکان ثبت تردد ندارید.');
      expect(component.activeLeaveInfo()?.leaveCategoryName).toBe('مرخصی استحقاقی');
    });
  });

  it('should setup countdown timer when on hourly leave', () => {
    const futureEndTime = '23:59:59';
    mockAttendanceService.getTodayAttendance.mockReturnValue(of({
      isCheckedIn: false,
      isCheckedOut: false,
      isAttendanceBlockedByLeave: true,
      activeLeave: {
        isHourly: true,
        startTime: '10:00',
        endTime: futureEndTime,
        leaveCategoryName: 'مرخصی ساعتی',
      },
    } as TodayAttendanceDto));

    runInInjectionContext(injector, () => {
      const component = new EmployeeDashboardComponent();
      component.ngOnInit();

      expect(component.isAttendanceBlocked()).toBe(true);
      expect(component.remainingCountdown()).not.toBeNull();
      component.ngOnDestroy();
    });
  });
});
