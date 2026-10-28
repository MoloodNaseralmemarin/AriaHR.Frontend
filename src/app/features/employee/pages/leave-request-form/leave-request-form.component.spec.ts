import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LeaveRequestFormComponent } from './leave-request-form.component';
import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveCategoryService } from '../../../leave-categories/services/leave-category.service';
import { LeavePolicyService } from '../../services/leave-policy.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { CreateLeaveRequestApiDto } from '../../models/leave-request.model';

describe('LeaveRequestFormComponent', () => {
  let component: LeaveRequestFormComponent;
  let mockRouter: any;
  let mockLeaveRequestService: any;
  let mockLeaveCategoryService: any;
  let mockLeavePolicyService: LeavePolicyService;
  let mockPersianDateService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRouter = {
      navigate: vi.fn(),
    };

    mockLeaveRequestService = {
      createLeaveRequest: vi.fn().mockReturnValue(of({ id: 'req-1' })),
      getLeaveRequests: vi.fn().mockReturnValue(of([])),
    };

    mockLeaveCategoryService = {
      getAll: vi.fn().mockReturnValue(
        of([
          { id: 'cat-1', name: 'استحقاقی', isPaid: true, maxDaysPerYear: 30, isActive: true },
          { id: 'cat-2', name: 'استعلاجی', isPaid: true, maxDaysPerYear: 0, isActive: true },
          { id: 'cat-3', name: 'غیرفعال', isPaid: false, maxDaysPerYear: 10, isActive: false },
        ])
      ),
    };

    mockPersianDateService = {
      toGregorianString: vi.fn((val: string) => {
        if (!val) return '';
        if (val === '2026-05-10') return '2026-05-10';
        if (val === '2026-05-12') return '2026-05-12';
        if (val === '2020-01-01') return '2020-01-01';
        return val;
      }),
      toJalaliString: vi.fn((val: string) => val || '---'),
      getTodayGregorianString: vi.fn(() => '2026-05-01'),
    };

    mockLeavePolicyService = new LeavePolicyService();

    const injector = createEnvironmentInjector([
      { provide: FormBuilder, useClass: FormBuilder },
      { provide: Router, useValue: mockRouter },
      { provide: LeaveRequestService, useValue: mockLeaveRequestService },
      { provide: LeaveCategoryService, useValue: mockLeaveCategoryService },
      { provide: LeavePolicyService, useValue: mockLeavePolicyService },
      { provide: PersianDateService, useValue: mockPersianDateService },
    ]);

    runInInjectionContext(injector, () => {
      component = new LeaveRequestFormComponent();
    });
  });

  it('should initialize with daily leave type and load active categories', () => {
    component.ngOnInit();
    expect(component.selectedLeaveType()).toBe('daily');
    expect(mockLeaveCategoryService.getAll).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
    expect(component.categories()[0].id).toBe('cat-1');
  });

  it('1. Dates earlier than today cannot be selected and are rejected with Persian error', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2020-01-01', // Before 2026-05-01
      endDate: '2020-01-01',
    });

    component.onSubmit();
    expect(component.formError()).toBe('امکان ثبت مرخصی برای تاریخ‌های گذشته وجود ندارد.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('2. Today\'s date remains selectable and accepted', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10', // After 2026-05-01
      endDate: '2026-05-10',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();
    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalled();
  });

  it('3. The backend rejects past dates according to approved policy', () => {
    mockLeaveRequestService.createLeaveRequest.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'امکان ثبت مرخصی برای تاریخ‌های گذشته وجود ندارد.' } }))
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-10',
    });

    component.onSubmit();
    expect(component.formError()).toBe('امکان ثبت مرخصی برای تاریخ‌های گذشته وجود ندارد.');
  });

  it('4. Leave requests within permitted entitlement are accepted', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-12', // 3 days (within 30 days max)
    });

    component.onSubmit();
    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalled();
  });

  it('5. Requests exceeding applicable entitlement are rejected', () => {
    // Set 29 days already consumed out of 30 maxDaysPerYear
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(
      of([
        {
          id: 'existing-1',
          leaveType: 'daily',
          leaveCategoryId: 'cat-1',
          startDate: '2026-01-01',
          endDate: '2026-01-29',
          status: 'approved',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ])
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-12', // 3 days requested (29 + 3 = 32 > 30)
    });

    component.onSubmit();
    expect(component.formError()).toContain('حد مجاز مرخصی');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('6. Rejected and cancelled requests are excluded from consumed entitlement', () => {
    // 29 days rejected or cancelled
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(
      of([
        {
          id: 'req-rejected',
          leaveType: 'daily',
          leaveCategoryId: 'cat-1',
          startDate: '2026-01-01',
          endDate: '2026-01-20',
          status: 'rejected',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'req-cancelled',
          leaveType: 'daily',
          leaveCategoryId: 'cat-1',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
          status: 'cancelled',
          createdAt: '2026-02-01T00:00:00Z',
        },
      ])
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-12', // 3 days requested -> total active = 3 <= 30
    });

    component.onSubmit();
    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalled();
  });

  it('7. Hourly leave lasting less than 8 hours can be submitted when otherwise valid', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2026-05-10',
      startTime: '09:00',
      endTime: '12:00', // 3 hours < 8 hours
      reason: 'ساعتی شخصی',
    });

    component.onSubmit();
    const expectedPayload: CreateLeaveRequestApiDto = {
      leaveType: 1,
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-10',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'ساعتی شخصی',
    };
    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalledWith(expectedPayload);
  });

  it('8. Hourly leave lasting exactly 8 hours automatically switches form to daily leave', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      date: '2026-05-10',
      startTime: '08:00',
      endTime: '16:00', // Exactly 8 hours = 480 mins
    });

    expect(component.selectedLeaveType()).toBe('daily');
    expect(component.form.get('startDate')?.value).toBe('2026-05-10');
    expect(component.form.get('endDate')?.value).toBe('2026-05-10');
  });

  it('9. Hourly leave lasting more than 8 hours automatically switches form to daily leave', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      date: '2026-05-10',
      startTime: '08:00',
      endTime: '17:00', // 9 hours > 8 hours
    });

    expect(component.selectedLeaveType()).toBe('daily');
    expect(component.form.get('startDate')?.value).toBe('2026-05-10');
    expect(component.form.get('endDate')?.value).toBe('2026-05-10');
  });

  it('10. Switching to daily leave clears hourly time fields so stale hourly values are not submitted', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      date: '2026-05-10',
      startTime: '09:00',
      endTime: '12:00',
    });

    component.setLeaveType('daily');
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-12',
    });

    component.onSubmit();

    const expectedPayload: CreateLeaveRequestApiDto = {
      leaveType: 2,
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      startTime: null,
      endTime: null,
      reason: null,
    };
    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalledWith(expectedPayload);
  });

  it('11. Direct API requests cannot bypass leave validation', () => {
    mockLeaveRequestService.createLeaveRequest.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'مدت مرخصی ساعتی نباید ۸ ساعت یا بیشتر باشد.' } }))
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-10',
    });

    component.onSubmit();
    expect(component.formError()).toBe('مدت مرخصی ساعتی نباید ۸ ساعت یا بیشتر باشد.');
  });

  it('12. Concurrent submissions cannot exceed permitted entitlement', () => {
    mockLeaveRequestService.createLeaveRequest.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: 'درخواست مرخصی با قوانین یا موجودی فعلی مغایرت دارد.' } }))
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2026-05-10',
      endDate: '2026-05-12',
    });

    component.onSubmit();
    expect(component.formError()).toContain('درخواست مرخصی دیگری در این بازه زمانی وجود دارد');
  });

  it('13. Jalali date display and DD-MM-YYYY format remain correct', () => {
    component.ngOnInit();
    expect(component.todayGregorian()).toBe('2026-05-01');
  });
});
