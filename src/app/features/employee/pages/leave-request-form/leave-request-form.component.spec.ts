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
import { CreateLeaveRequestApiDto } from '../../models/leave-request.model';

describe('LeaveRequestFormComponent', () => {
  let component: LeaveRequestFormComponent;
  let mockRouter: any;
  let mockLeaveRequestService: any;
  let mockLeaveCategoryService: any;
  let mockPersianDateService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRouter = {
      navigate: vi.fn(),
    };

    mockLeaveRequestService = {
      createLeaveRequest: vi.fn().mockReturnValue(of({ id: 'req-1' })),
    };

    mockLeaveCategoryService = {
      getAll: vi.fn().mockReturnValue(
        of([
          { id: 'cat-1', name: 'استحقاقی', isPaid: true, isActive: true },
          { id: 'cat-2', name: 'استعلاجی', isPaid: true, isActive: true },
          { id: 'cat-3', name: 'غیرفعال', isPaid: false, isActive: false },
        ])
      ),
    };

    mockPersianDateService = {
      toGregorianString: vi.fn((val: string) => {
        if (!val) return '';
        if (val === '2025-05-10') return '2025-05-10';
        if (val === '2025-05-12') return '2025-05-12';
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

  it('should initialize with daily leave type and load active categories', () => {
    component.ngOnInit();
    expect(component.selectedLeaveType()).toBe('daily');
    expect(mockLeaveCategoryService.getAll).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
    expect(component.categories()[0].id).toBe('cat-1');
  });

  it('1. should submit a valid multi-day daily leave request without hourly times', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
      reason: 'مرخصی سالانه',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();

    const expectedPayload: CreateLeaveRequestApiDto = {
      leaveType: 1,
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
      startTime: null,
      endTime: null,
      reason: 'مرخصی سالانه',
    };

    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalledWith(expectedPayload);
  });

  it('1b. should submit a valid single-day daily leave request without entering endDate (defaulting endDate to startDate)', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '',
      reason: 'یک روز مرخصی',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();

    const expectedPayload: CreateLeaveRequestApiDto = {
      leaveType: 1,
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-10',
      startTime: null,
      endTime: null,
      reason: 'یک روز مرخصی',
    };

    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalledWith(expectedPayload);
  });

  it('2. should submit a valid hourly leave request using only one date and times', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2025-05-10',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'کارهای شخصی',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();

    const expectedPayload: CreateLeaveRequestApiDto = {
      leaveType: 2,
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-10',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'کارهای شخصی',
    };

    expect(mockLeaveRequestService.createLeaveRequest).toHaveBeenCalledWith(expectedPayload);
  });

  it('3. should reject missing start date for daily leave', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '',
      endDate: '2025-05-12',
    });

    expect(component.form.valid).toBe(false);
    component.onSubmit();
    expect(component.formError()).toBe('لطفاً تاریخ شروع مرخصی را وارد کنید.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('4. should reject missing hourly times for hourly leave', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2025-05-10',
      startTime: '09:00',
      endTime: '',
    });

    expect(component.form.valid).toBe(false);
    component.onSubmit();
    expect(component.formError()).toBe('لطفاً تاریخ، ساعت شروع و ساعت پایان را وارد کنید.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('5. should reject invalid time ranges for hourly leave (endTime <= startTime)', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2025-05-10',
      startTime: '14:00',
      endTime: '10:00',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();
    expect(component.formError()).toBe('ساعت پایان باید بعد از ساعت شروع باشد.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('6. should reject invalid date ranges for daily leave (endDate < startDate)', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-12',
      endDate: '2025-05-10',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();
    expect(component.formError()).toBe('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('7. should clear daily values and errors when switching to hourly leave', () => {
    component.ngOnInit();
    component.form.patchValue({
      startDate: '2025-05-10',
      endDate: '2025-05-12',
    });

    component.setLeaveType('hourly');

    expect(component.form.get('startDate')?.value).toBe('');
    expect(component.form.get('endDate')?.value).toBe('');
    expect(component.form.get('startDate')?.validator).toBeNull();
    expect(component.form.get('endDate')?.validator).toBeNull();
    expect(component.form.get('date')?.validator).not.toBeNull();
    expect(component.form.get('startTime')?.validator).not.toBeNull();
    expect(component.form.get('endTime')?.validator).not.toBeNull();
  });

  it('8. should clear hourly values and errors when switching back to daily leave', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');
    component.form.patchValue({
      date: '2025-05-10',
      startTime: '09:00',
      endTime: '12:00',
    });

    component.setLeaveType('daily');

    expect(component.form.get('date')?.value).toBe('');
    expect(component.form.get('startTime')?.value).toBe('');
    expect(component.form.get('endTime')?.value).toBe('');
    expect(component.form.get('date')?.validator).toBeNull();
    expect(component.form.get('startTime')?.validator).toBeNull();
    expect(component.form.get('endTime')?.validator).toBeNull();
    expect(component.form.get('startDate')?.validator).not.toBeNull();
  });

  it('9. should compute durations correctly for daily and hourly leave without interference', () => {
    component.ngOnInit();
    component.form.patchValue({
      startDate: '2025-05-10',
      endDate: '2025-05-12',
    });
    expect(component.computedDuration()).toBe('3 روز');

    component.setLeaveType('hourly');
    component.form.patchValue({
      startTime: '08:30',
      endTime: '11:15',
    });
    expect(component.computedDuration()).toBe('2 ساعت و 45 دقیقه');
  });

  it('10. should handle leave creation API error response gracefully', () => {
    mockLeaveRequestService.createLeaveRequest.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'موجودی مرخصی شما کافی نیست.' } }))
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
    });

    component.onSubmit();
    expect(component.formError()).toBe('موجودی مرخصی شما کافی نیست.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('11. should map field-specific validation errors from ProblemDetails to form controls', () => {
    mockLeaveRequestService.createLeaveRequest.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: {
            StartDate: ['The JSON value could not be converted to System.DateOnly.'],
            LeaveCategoryId: ['Required field.'],
          },
        },
      }))
    );

    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
    });

    component.onSubmit();

    expect(component.form.get('startDate')?.getError('serverError')).toBe('فرمت تاریخ وارد شده معتبر نمی‌باشد.');
    expect(component.form.get('leaveCategoryId')?.getError('serverError')).toBe('ورود این فیلد الزامی است.');
    expect(component.formError()).toBe('لطفاً خطاهای مشخص‌شده در فرم را بررسی و اصلاح فرمایید.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('12. should clear serverError on control when control value changes', () => {
    component.ngOnInit();
    component.form.get('startDate')?.setErrors({ serverError: 'خطا' });
    expect(component.form.get('startDate')?.hasError('serverError')).toBe(true);

    component.form.get('startDate')?.setValue('2025-05-11');
    expect(component.form.get('startDate')?.hasError('serverError')).toBe(false);
  });
});
