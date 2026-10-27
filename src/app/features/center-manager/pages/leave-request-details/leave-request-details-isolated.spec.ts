import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LeaveRequestDetailsComponent } from './leave-request-details.component';
import { LeaveRequestService } from '../../../employee/services/leave-request.service';
import { LeaveRequestDetailDto } from '../../../employee/models/leave-request.model';

describe('LeaveRequestDetailsComponent (Isolated Unit Tests)', () => {
  let mockLeaveRequestService: {
    getLeaveRequestById: ReturnType<typeof vi.fn>;
  };
  let mockActivatedRoute: {
    paramMap: any;
    snapshot: {
      paramMap: {
        get: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockLocation: {
    back: ReturnType<typeof vi.fn>;
  };

  const mockDetail: LeaveRequestDetailDto = {
    id: 'req-123',
    employeeId: 'emp-456',
    organizationId: 'org-789',
    leaveType: 'daily',
    leaveTypeRaw: 2,
    leaveCategoryId: 'cat-001',
    leaveCategoryName: 'مرخصی استحقاقی',
    employeeFirstName: 'علی',
    employeeLastName: 'محمدی',
    employeeFullName: 'علی محمدی',
    startDate: '2026-10-27',
    endDate: '2026-10-28',
    startTime: null,
    endTime: null,
    reason: 'امور شخصی',
    status: 'approved',
    statusRaw: 1,
    rejectedReason: null,
    approvedAt: '2026-10-27T10:00:00Z',
    approvedBy: 'مدیر کلینیک',
    createdAtUtc: '2026-10-26T12:00:00Z',
  };

  beforeEach(() => {
    mockLeaveRequestService = {
      getLeaveRequestById: vi.fn().mockReturnValue(of(mockDetail)),
    };

    mockActivatedRoute = {
      paramMap: of({ get: (key: string) => (key === 'id' ? 'req-123' : null) }),
      snapshot: {
        paramMap: {
          get: vi.fn().mockImplementation((key: string) => (key === 'id' ? 'req-123' : null)),
        },
      },
    };

    mockLocation = {
      back: vi.fn(),
    };
  });

  function createComponentWithContext(): LeaveRequestDetailsComponent {
    const injector = Injector.create({
      providers: [
        { provide: LeaveRequestService, useValue: mockLeaveRequestService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation },
      ],
    });

    return runInInjectionContext(injector, () => new LeaveRequestDetailsComponent());
  }

  it('should initialize and load leave request details from route param ID', () => {
    const component = createComponentWithContext();
    component.ngOnInit();

    expect(mockLeaveRequestService.getLeaveRequestById).toHaveBeenCalledWith('req-123');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.request()).toEqual(mockDetail);
  });

  it('should call location.back() on goBack()', () => {
    const component = createComponentWithContext();
    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('should handle missing ID parameter with appropriate error', () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
    const component = createComponentWithContext();
    component.ngOnInit();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('شناسه درخواست مرخصی معتبر نیست.');
    expect(component.request()).toBeNull();
  });

  it('should handle API errors gracefully', () => {
    mockLeaveRequestService.getLeaveRequestById.mockReturnValue(
      throwError(() => ({ message: 'خطای سرور' }))
    );

    const component = createComponentWithContext();
    component.ngOnInit();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('خطای سرور');
    expect(component.request()).toBeNull();
  });

  it('should construct employee name correctly when employeeFullName is missing', () => {
    const component = createComponentWithContext();
    const partialReq: LeaveRequestDetailDto = {
      ...mockDetail,
      employeeFullName: null,
      employeeFirstName: 'رضا',
      employeeLastName: 'حسینی',
    };

    expect(component.getEmployeeName(partialReq)).toBe('رضا حسینی');
  });

  it('should return fallback label when employee name is completely missing', () => {
    const component = createComponentWithContext();
    const partialReq: LeaveRequestDetailDto = {
      ...mockDetail,
      employeeFullName: null,
      employeeFirstName: null,
      employeeLastName: null,
    };

    expect(component.getEmployeeName(partialReq)).toBe('ثبت نشده');
  });

  it('should format status labels correctly', () => {
    const component = createComponentWithContext();

    expect(component.getStatusLabel('approved')).toBe('تأیید شده');
    expect(component.getStatusLabel('rejected')).toBe('رد شده');
    expect(component.getStatusLabel('cancelled')).toBe('لغو شده');
    expect(component.getStatusLabel('pending')).toBe('در انتظار بررسی');
    expect(component.getStatusLabel('unknown' as any)).toBe('در انتظار بررسی');
    expect(component.getStatusLabel(null)).toBe('در انتظار بررسی');
    expect(component.getStatusLabel(undefined)).toBe('در انتظار بررسی');
  });

  it('should return correct badge tones for status values', () => {
    const component = createComponentWithContext();

    expect(component.getStatusBadgeTone('approved')).toBe('success');
    expect(component.getStatusBadgeTone('rejected')).toBe('danger');
    expect(component.getStatusBadgeTone('cancelled')).toBe('neutral');
    expect(component.getStatusBadgeTone('pending')).toBe('warning');
    expect(component.getStatusBadgeTone('unknown')).toBe('warning');
    expect(component.getStatusBadgeTone(null)).toBe('warning');
    expect(component.getStatusBadgeTone(undefined)).toBe('warning');
  });

  it('should format leave type labels correctly', () => {
    const component = createComponentWithContext();

    expect(component.getLeaveTypeLabel('daily')).toBe('روزانه');
    expect(component.getLeaveTypeLabel('hourly')).toBe('ساعتی');
  });

  it('should handle getDisplayValue fallback for null or whitespace values', () => {
    const component = createComponentWithContext();

    expect(component.getDisplayValue(null)).toBe('ثبت نشده');
    expect(component.getDisplayValue('')).toBe('ثبت نشده');
    expect(component.getDisplayValue('  ')).toBe('ثبت نشده');
    expect(component.getDisplayValue('توضیحات')).toBe('توضیحات');
  });
});
