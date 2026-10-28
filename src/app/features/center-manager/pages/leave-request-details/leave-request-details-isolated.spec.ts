import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LeaveRequestDetailsComponent } from './leave-request-details.component';
import { LeaveRequestService } from '../../../employee/services/leave-request.service';
import { LeaveRequestDetailDto } from '../../../employee/models/leave-request.model';
import { PersianDateService } from '../../../../core/services/persian-date.service';

describe('LeaveRequestDetailsComponent (Isolated Unit Tests)', () => {
  let mockLeaveRequestService: {
    getLeaveRequestById: ReturnType<typeof vi.fn>;
    approveLeaveRequest: ReturnType<typeof vi.fn>;
    rejectLeaveRequest: ReturnType<typeof vi.fn>;
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
  let mockPersianDateService: {
    toJalaliString: ReturnType<typeof vi.fn>;
    formatDateRange: ReturnType<typeof vi.fn>;
  };

  const mockPendingDetail: LeaveRequestDetailDto = {
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
    status: 'pending',
    statusRaw: 0,
    rejectedReason: null,
    approvedAt: null,
    approvedBy: null,
    createdAtUtc: '2026-10-26T12:00:00Z',
  };

  const mockApprovedDetail: LeaveRequestDetailDto = {
    ...mockPendingDetail,
    status: 'approved',
    statusRaw: 1,
    approvedAt: '2026-10-27T10:00:00Z',
    approvedBy: 'مدیر کلینیک',
  };

  const mockRejectedDetail: LeaveRequestDetailDto = {
    ...mockPendingDetail,
    status: 'rejected',
    statusRaw: 2,
    rejectedReason: 'عدم موافقت با زمان درخواست',
    approvedAt: '2026-10-27T10:00:00Z',
    approvedBy: 'مدیر کلینیک',
  };

  beforeEach(() => {
    mockLeaveRequestService = {
      getLeaveRequestById: vi.fn().mockReturnValue(of(mockPendingDetail)),
      approveLeaveRequest: vi.fn().mockReturnValue(of(mockApprovedDetail)),
      rejectLeaveRequest: vi.fn().mockReturnValue(of(mockRejectedDetail)),
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

    mockPersianDateService = {
      toJalaliString: vi.fn().mockReturnValue('1405-08-05'),
      formatDateRange: vi.fn().mockReturnValue('05-08-1405 تا 06-08-1405'),
    };
  });

  function createComponentWithContext(): LeaveRequestDetailsComponent {
    const injector = Injector.create({
      providers: [
        { provide: LeaveRequestService, useValue: mockLeaveRequestService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation },
        { provide: PersianDateService, useValue: mockPersianDateService },
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
    expect(component.request()).toEqual(mockPendingDetail);
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

  it('should open and close review modal for pending requests', () => {
    const component = createComponentWithContext();
    component.ngOnInit();

    component.openReviewModal('approve');
    expect(component.activeModal()).toBe('approve');
    expect(component.reviewComment()).toBe('');

    component.closeModal();
    expect(component.activeModal()).toBeNull();
  });

  it('should not open review modal for non-pending requests', () => {
    mockLeaveRequestService.getLeaveRequestById.mockReturnValue(of(mockApprovedDetail));
    const component = createComponentWithContext();
    component.ngOnInit();

    component.openReviewModal('approve');
    expect(component.activeModal()).toBeNull();
  });

  it('should validate review comment length over 500 characters', () => {
    const component = createComponentWithContext();
    component.ngOnInit();
    component.openReviewModal('approve');

    const longText = 'a'.repeat(501);
    component.onCommentInput(longText);

    expect(component.commentError()).toBe('توضیحات نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.');
  });

  it('should successfully submit approval decision and update request state', () => {
    const component = createComponentWithContext();
    component.ngOnInit();
    component.openReviewModal('approve');
    component.onCommentInput('موافقت گردید');

    component.submitDecision();

    expect(mockLeaveRequestService.approveLeaveRequest).toHaveBeenCalledWith('req-123', 'موافقت گردید');
    expect(component.request()).toEqual(mockApprovedDetail);
    expect(component.activeModal()).toBeNull();
    expect(component.toastMessage()).toBe('درخواست مرخصی با موفقیت تأیید شد.');
  });

  it('should successfully submit rejection decision and update request state', () => {
    const component = createComponentWithContext();
    component.ngOnInit();
    component.openReviewModal('reject');
    component.onCommentInput('عدم موافقت با زمان درخواست');

    component.submitDecision();

    expect(mockLeaveRequestService.rejectLeaveRequest).toHaveBeenCalledWith('req-123', 'عدم موافقت با زمان درخواست');
    expect(component.request()).toEqual(mockRejectedDetail);
    expect(component.activeModal()).toBeNull();
    expect(component.toastMessage()).toBe('درخواست مرخصی با موفقیت رد شد.');
  });

  it('should format Jalali dates correctly for single and range dates', () => {
    const component = createComponentWithContext();
    const singleDay: LeaveRequestDetailDto = {
      ...mockPendingDetail,
      startDate: '2026-10-27',
      endDate: '2026-10-27',
    };

    expect(component.getDateDisplay(singleDay)).toBe('1405-08-05');

    const rangeDay: LeaveRequestDetailDto = {
      ...mockPendingDetail,
      startDate: '2026-10-27',
      endDate: '2026-10-28',
    };

    expect(component.getDateDisplay(rangeDay)).toBe('05-08-1405 تا 06-08-1405');
  });
});
