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
        if (!val) return null;
        if (val === '2025-05-10') return '2025-05-10';
        if (val === '2025-05-12') return '2025-05-12';
        if (val === '1404/02/20' || val === '20-02-1404') return '2025-05-10';
        if (val === '1404/02/22' || val === '22-02-1404') return '2025-05-12';
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

  it('1. should submit a valid daily leave request spanning multiple days without hourly times', () => {
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

  it('2. should submit a valid hourly leave request with identical start and end dates', () => {
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
    expect(expectedPayload.startDate).toBe(expectedPayload.endDate);
  });

  it('3. should reject an hourly request if start and end dates differ', () => {
    component.ngOnInit();
    component.setLeaveType('hourly');

    vi.spyOn(component, 'toGregorian')
      .mockReturnValueOnce('2025-05-10')
      .mockReturnValueOnce('2025-05-11');

    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      date: '2025-05-10',
      startTime: '09:00',
      endTime: '12:00',
    });

    component.onSubmit();
    expect(component.formError()).toBe('در مرخصی ساعتی، تاریخ شروع و پایان باید برابر باشد.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('4. should test date serialization and mapping between Jalali/Gregorian and API DTO', () => {
    expect(component.toGregorian('2025-05-10')).toBe('2025-05-10');
    expect(component.toGregorian('2025-05-10T00:00:00Z')).toBe('2025-05-10');
    expect(component.toGregorian('20-02-1404')).toBe('2025-05-10');
  });

  it('5. should reject missing daily dates for daily leave', () => {
    component.ngOnInit();
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '',
      endDate: '2025-05-12',
    });

    expect(component.form.valid).toBe(false);
    component.onSubmit();
    expect(component.formError()).toBe('لطفاً تاریخ شروع و پایان مرخصی را وارد کنید.');
    expect(mockLeaveRequestService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it('6. should reject missing hourly times for hourly leave', () => {
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

  it('7. should reject invalid time ranges for hourly leave (endTime <= startTime)', () => {
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

  it('8. should reject invalid date ranges for daily leave (endDate < startDate)', () => {
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

  it('9. should clear daily values and errors when switching to hourly leave', () => {
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

  it('10. should clear hourly values and errors when switching back to daily leave', () => {
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
    expect(component.form.get('endDate')?.validator).not.toBeNull();
  });

  it('11. should compute durations correctly for daily and hourly leave without interference', () => {
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

  it('12. should handle leave creation API error response gracefully', () => {
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
});
