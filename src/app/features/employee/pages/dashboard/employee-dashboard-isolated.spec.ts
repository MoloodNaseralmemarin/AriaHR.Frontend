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
import { AttendanceRecordDto } from '../../models/employee-attendance.models';
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
    getCurrentAttendance: ReturnType<typeof vi.fn>;
  };
  let mockLeaveRequestService: {
    getLeaveRequests: ReturnType<typeof vi.fn>;
  };
  let mockPersianDateService: {
    getTodayFormatted: ReturnType<typeof vi.fn>;
  };
  let injector: Injector;

  const todayIso = new Date().toISOString().split('T')[0];

  const openRecord: AttendanceRecordDto = {
    id: 'att-1',
    organizationId: 'org-1',
    employeeId: 'emp-1',
    checkInTime: new Date().toISOString(),
    method: 'QRCode',
    status: 'Present',
    isWithinGeofence: true,
    createdAtUtc: new Date().toISOString(),
  };

  function createComponent(): EmployeeDashboardComponent {
    let component!: EmployeeDashboardComponent;
    runInInjectionContext(injector, () => {
      component = new EmployeeDashboardComponent();
    });
    return component;
  }

  beforeEach(() => {
    userDetailsSignal = signal<CurrentUserDto | null>(null);
    currentUserSignal = signal<AuthUserDto | null>(null);

    mockAuthService = {
      userDetails: userDetailsSignal,
      currentUser: currentUserSignal,
      getCurrentUser: vi.fn().mockReturnValue(of(null)),
    };

    mockAttendanceService = {
      getCurrentAttendance: vi.fn().mockReturnValue(of(openRecord)),
    };

    mockLeaveRequestService = {
      getLeaveRequests: vi.fn().mockReturnValue(
        of([
          {
            id: 'leave-1',
            leaveType: 'daily',
            startDate: '1403-02-10',
            durationText: '1 روز',
            reason: 'شخصی',
            status: 'pending',
            createdAt: '1403-02-09',
          } as LeaveRequestDto,
        ])
      ),
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
    const component = createComponent();
    component.ngOnInit();

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(mockAttendanceService.getCurrentAttendance).toHaveBeenCalled();
    expect(mockLeaveRequestService.getLeaveRequests).toHaveBeenCalled();
    expect(component.isLoadingUser()).toBe(false);
    expect(component.isLoadingAttendance()).toBe(false);
    expect(component.isLoadingLeaves()).toBe(false);
  });

  it('should compute employee full name from userDetails (firstName + lastName)', () => {
    userDetailsSignal.set({
      id: 'emp-123',
      firstName: 'علی',
      lastName: 'رضایی',
      phoneNumber: '09121112233',
      roles: ['Employee'],
      organizationId: 'org-1',
    });

    const component = createComponent();
    expect(component.employeeName()).toBe('علی رضایی');
  });

  it('should compute employee name from AuthUserDto.fullName if userDetails is missing', () => {
    currentUserSignal.set({
      id: 'emp-123',
      fullName: 'مریم احمدی',
      roles: ['Employee'],
    });

    const component = createComponent();
    expect(component.employeeName()).toBe('مریم احمدی');
  });

  it('should fallback to "کارمند" when all name properties are null or empty', () => {
    userDetailsSignal.set({
      id: 'emp-123',
      firstName: '',
      lastName: '',
      phoneNumber: '09121112233',
      roles: ['Employee'],
      organizationId: 'org-1',
    });

    const component = createComponent();
    expect(component.employeeName()).toBe('کارمند');
  });

  it('should handle API errors gracefully', () => {
    mockAttendanceService.getCurrentAttendance.mockReturnValue(
      throwError(() => new Error('API Error'))
    );
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(
      throwError(() => new Error('API Error'))
    );

    const component = createComponent();
    component.ngOnInit();

    expect(component.attendanceError()).toBe(true);
    expect(component.isLoadingAttendance()).toBe(false);
    expect(component.isLoadingLeaves()).toBe(false);
  });

  it('should return correct badge tones for attendance and leave request status', () => {
    const component = createComponent();
    component.ngOnInit();

    expect(component.attendanceStatusTone()).toBe('success');
    expect(component.getLeaveStatusTone('pending')).toBe('warning');
    expect(component.getLeaveStatusTone('approved')).toBe('success');
    expect(component.getLeaveStatusTone('rejected')).toBe('danger');
    expect(component.getLeaveStatusTone('cancelled')).toBe('neutral');
  });

  it('should detect a daily approved leave covering today', () => {
    mockAttendanceService.getCurrentAttendance.mockReturnValue(of(null));
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(
      of([
        {
          id: 'leave-1',
          leaveType: 'daily',
          startDate: todayIso,
          endDate: todayIso,
          durationText: '1 روز',
          reason: 'شخصی',
          status: 'approved',
          categoryName: 'مرخصی استحقاقی',
          createdAt: todayIso,
        } as LeaveRequestDto,
      ])
    );

    const component = createComponent();
    component.ngOnInit();

    expect(component.isAttendanceBlocked()).toBe(true);
    expect(component.leaveRestrictionBannerMessage()).toBe(
      'شما امروز در مرخصی هستید و امکان ثبت تردد ندارید.'
    );
    expect(component.activeLeaveInfo()?.leaveCategoryName).toBe('مرخصی استحقاقی');
  });

  it('should setup countdown timer when on hourly leave', () => {
    mockAttendanceService.getCurrentAttendance.mockReturnValue(of(null));
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(
      of([
        {
          id: 'leave-1',
          leaveType: 'hourly',
          startDate: todayIso,
          date: todayIso,
          startTime: '10:00',
          endTime: '23:59:59',
          durationText: '2 ساعت',
          reason: 'شخصی',
          status: 'approved',
          categoryName: 'مرخصی ساعتی',
          createdAt: todayIso,
        } as LeaveRequestDto,
      ])
    );

    const component = createComponent();
    component.ngOnInit();

    expect(component.isAttendanceBlocked()).toBe(true);
    expect(component.remainingCountdown()).not.toBeNull();
    component.ngOnDestroy();
  });
});
