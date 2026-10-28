import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LeaveRequestFormComponent } from './leave-request-form.component';
import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveCategoryService } from '../../../leave-categories/services/leave-category.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { CreateLeaveRequestApiDto, LeaveRequestDto } from '../../models/leave-request.model';

describe('LeaveRequestFormComponent', () => {
  let component: LeaveRequestFormComponent;
  let mockRouter: any;
  let mockLeaveRequestService: any;
  let mockLeaveCategoryService: any;
  let mockPersianDateService: any;

  const sampleExistingRequests: LeaveRequestDto[] = [
    {
      id: 'req-1',
      leaveType: 'daily',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
      status: 'approved',
      durationText: '3 روز',
      createdAt: '2025-05-01',
    },
    {
      id: 'req-2',
      leaveType: 'hourly',
      date: '2025-05-15',
      startTime: '08:00',
      endTime: '12:00',
      status: 'pending',
      durationText: '4 ساعت',
      createdAt: '2025-05-01',
    },
    {
      id: 'req-3',
      leaveType: 'daily',
      startDate: '2025-05-20',
      endDate: '2025-05-20',
      status: 'rejected',
      durationText: '1 روز',
      createdAt: '2025-05-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockRouter = {
      navigate: vi.fn(),
    };

    mockLeaveRequestService = {
      getLeaveRequests: vi.fn().mockReturnValue(of(sampleExistingRequests)),
      createLeaveRequest: vi.fn().mockReturnValue(of({ id: 'new-req-1' })),
    };

    mockLeaveCategoryService = {
      getAll: vi.fn().mockReturnValue(
        of([
          { id: 'cat-1', name: 'استحقاقی', isPaid: true, isActive: true },
          { id: 'cat-2', name: 'استعلاجی', isPaid: true, isActive: true },
        ])
      ),
    };

    mockPersianDateService = {
      toGregorianString: vi.fn((val: string) => {
        if (!val) return '';
        if (val === '2025-05-10') return '2025-05-10';
        if (val === '2025-05-11') return '2025-05-11';
        if (val === '2025-05-12') return '2025-05-12';
        if (val === '2025-05-15') return '2025-05-15';
        if (val === '2025-05-20') return '2025-05-20';
        return val;
      }),
      toJalaliString: vi.fn((val: string) => val || '---'),
    };

    const injector = createEnvironmentInjector([
      { provide: FormBuilder, useClass: FormBuilder },
      { provide: Router, useValue: mockRouter },
      { provide: LeaveRequestService, useValue: mockLeaveRequestService },
      { provide: LeaveCategoryService, useValue: mockLeaveCategoryService },
      { provide: PersianDateService, useValue: mockPersianDateService },
    ]);

    runInInjectionContext(injector, () => {
      component = new LeaveRequestFormComponent();
    });
  });

  it('should initialize and fetch categories and existing leave requests', () => {
    component.ngOnInit();
    expect(component.selectedLeaveType()).toBe('daily');
    expect(mockLeaveCategoryService.getAll).toHaveBeenCalled();
    expect(mockLeaveRequestService.getLeaveRequests).toHaveBeenCalled();
    expect(component.existingRequests().length).toBe(3);
    expect(component.isLoadingExistingRequests()).toBe(false);
  });

  it('1. detects duplicate daily leave on the same date and sets conflict error', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-10',
    });

    expect(component.conflictError()).not.toBeNull();
    expect(component.conflictError()).toContain('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');

    component.onSubmit();
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('2. detects overlapping daily leave date ranges', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-11',
      endDate: '2025-05-13',
    });

    expect(component.conflictError()).not.toBeNull();
    expect(component.conflictError()).toContain('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
  });

  it('3. detects overlapping hourly leave intervals', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2025-05-15',
      startTime: '09:00',
      endTime: '11:00',
    });

    expect(component.conflictError()).not.toBeNull();
    expect(component.conflictError()).toContain('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
  });

  it('4. permits non-overlapping hourly leave intervals', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2025-05-15',
      startTime: '12:00',
      endTime: '14:00',
    });

    expect(component.conflictError()).toBeNull();
  });

  it('5. detects daily leave conflicting with hourly leave on the same date', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-15',
      endDate: '2025-05-15',
    });

    expect(component.conflictError()).not.toBeNull();
    expect(component.conflictError()).toContain('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
  });

  it('6. ignores Rejected requests when checking conflicts', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-20',
      endDate: '2025-05-20',
    });

    expect(component.conflictError()).toBeNull();
  });

  it('7. revalidates when changing dates or leave types', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
    });

    expect(component.conflictError()).not.toBeNull();

    component.form.patchValue({
      startDate: '2025-05-25',
    });

    expect(component.conflictError()).toBeNull();
  });

  it('8. handles failures when loading existing leave requests and disables form submission', () => {
    mockLeaveRequestService.getLeaveRequests.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.ngOnInit();

    expect(component.existingRequestsError()).not.toBeNull();
    expect(component.existingRequestsError()).toContain('خطا در دریافت لیست درخواست‌های قبلی');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-25',
    });

    component.onSubmit();
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
    expect(component.formError()).toContain('ثبت درخواست امکان‌پذیر نیست');
  });

  it('9. handles backend 409 conflict error during submission', () => {
    mockLeaveRequestService.createLeaveRequest.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: 'Conflict' } }))
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-25',
      endDate: '2025-05-25',
    });

    component.onSubmit();

    expect(component.formError()).toBe('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
    expect(component.conflictError()).toBe('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
    expect(component.isSubmitting()).toBe(false);
  });
});
