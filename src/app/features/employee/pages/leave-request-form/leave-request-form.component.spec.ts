import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveRequestFormComponent } from './leave-request-form.component';
import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveCategoryService } from '../../../leave-categories/services/leave-category.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { of, throwError } from 'rxjs';

describe('LeaveRequestFormComponent', () => {
  let component: LeaveRequestFormComponent;
  let leaveRequestServiceMock: any;
  let leaveCategoryServiceMock: any;
  let routerMock: any;

  const mockCategories = [
    { id: 'cat-1', name: 'استحقاقی', isPaid: true, isActive: true, maxDaysPerYear: 30, requiresAttachment: false, organizationId: 'org-1' },
    { id: 'cat-2', name: 'استعلاجی', isPaid: true, isActive: true, maxDaysPerYear: 15, requiresAttachment: true, organizationId: 'org-1' },
    { id: 'cat-3', name: 'غیرفعال', isPaid: false, isActive: false, maxDaysPerYear: 5, requiresAttachment: false, organizationId: 'org-1' },
  ];

  beforeEach(() => {
    leaveRequestServiceMock = {
      createLeaveRequest: vi.fn(),
    };
    leaveCategoryServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockCategories)),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    const parentInjector = {
      get: (token: any, notFoundValue?: any) => notFoundValue,
    } as any;

    const injector = createEnvironmentInjector([
      FormBuilder,
      { provide: LeaveRequestService, useValue: leaveRequestServiceMock },
      { provide: LeaveCategoryService, useValue: leaveCategoryServiceMock },
      { provide: Router, useValue: routerMock },
      { provide: PersianDateService, useClass: PersianDateService },
    ], parentInjector);

    runInInjectionContext(injector, () => {
      component = new LeaveRequestFormComponent();
    });
  });

  it('should initialize with daily leave type default and load all categories on init without auto-selecting', () => {
    expect(component.selectedLeaveType()).toBe('daily');
    component.ngOnInit();
    expect(leaveCategoryServiceMock.getAll).toHaveBeenCalled();
    // All categories returned from API should be stored without client-side filtering
    expect(component.categories().length).toBe(3);
    // leaveCategoryId control should remain unselected ('')
    expect(component.form.get('leaveCategoryId')?.value).toBe('');
  });

  it('should preserve id, organizationId, and name on loaded categories and keep form unselected by default', () => {
    component.ngOnInit();
    const categories = component.categories();
    expect(categories[0].id).toBe('cat-1');
    expect(categories[0].organizationId).toBe('org-1');
    expect(categories[0].name).toBe('استحقاقی');
    expect(component.form.get('leaveCategoryId')?.value).toBe('');
  });

  it('should display specific Persian error message on HTTP 403 Forbidden category fetch failure', () => {
    leaveCategoryServiceMock.getAll.mockReturnValue(throwError(() => ({ status: 403 })));
    component.ngOnInit();
    expect(component.isLoadingCategories()).toBe(false);
    expect(component.categoriesError()).toBe(
      'شما دسترسی لازم برای دریافت دسته‌بندی‌های مرخصی را ندارید. این موضوع نیازمند اصلاح در سمت سرور توسط مدیر سیستم می‌باشد.'
    );
  });

  it('should switch leave type correctly and reset irrelevant fields', () => {
    component.ngOnInit();
    component.form.patchValue({ startDate: '2025-02-10', endDate: '2025-02-12' });

    component.setLeaveType('hourly');
    expect(component.selectedLeaveType()).toBe('hourly');
    expect(component.form.get('startDate')?.value).toBe('');
    expect(component.form.get('endDate')?.value).toBe('');

    component.form.patchValue({ date: '2025-02-15', startTime: '08:00', endTime: '12:00' });
    component.setLeaveType('daily');
    expect(component.selectedLeaveType()).toBe('daily');
    expect(component.form.get('date')?.value).toBe('');
    expect(component.form.get('startTime')?.value).toBe('');
    expect(component.form.get('endTime')?.value).toBe('');
  });

  it('should show error when category is missing', () => {
    component.form.patchValue({ leaveCategoryId: '' });
    component.setLeaveType('daily');
    component.onSubmit();
    expect(component.formError()).toBe('لطفاً دسته مرخصی را انتخاب کنید.');
  });

  it('should show error when daily dates are missing or invalid', () => {
    component.ngOnInit();
    component.form.patchValue({ leaveCategoryId: 'cat-1' });
    component.setLeaveType('daily');
    component.onSubmit();
    expect(component.formError()).toBe('لطفاً تاریخ شروع و پایان مرخصی را وارد کنید.');

    component.form.patchValue({
      startDate: '2025-02-15',
      endDate: '2025-02-10',
    });
    component.onSubmit();
    expect(component.formError()).toBe('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.');
  });

  it('should show error when hourly inputs are missing or invalid', () => {
    component.ngOnInit();
    component.form.patchValue({ leaveCategoryId: 'cat-1' });
    component.setLeaveType('hourly');
    component.onSubmit();
    expect(component.formError()).toBe('لطفاً تاریخ، ساعت شروع و ساعت پایان را وارد کنید.');

    component.form.patchValue({
      date: '2025-02-15',
      startTime: '14:00',
      endTime: '12:00',
    });
    component.onSubmit();
    expect(component.formError()).toBe('ساعت پایان باید بعد از ساعت شروع باشد.');
  });

  it('should submit daily leave successfully and navigate', () => {
    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(of({ id: 'req-1' }));
    component.ngOnInit();
    component.setLeaveType('daily');
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      reason: '  استراحت  ',
    });

    component.onSubmit();

    expect(leaveRequestServiceMock.createLeaveRequest).toHaveBeenCalledWith({
      leaveType: 1,
      leaveCategoryId: 'cat-1',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      startTime: null,
      endTime: null,
      reason: 'استراحت',
    });
  });

  it('should submit hourly leave with correct numeric leaveType 2 and formatted times', () => {
    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(of({ id: 'req-2' }));
    component.ngOnInit();
    component.setLeaveType('hourly');
    component.form.patchValue({
      leaveCategoryId: 'cat-2',
      date: '2025-02-15',
      startTime: '08:30',
      endTime: '12:30',
      reason: '',
    });

    component.onSubmit();

    expect(leaveRequestServiceMock.createLeaveRequest).toHaveBeenCalledWith({
      leaveType: 2,
      leaveCategoryId: 'cat-2',
      startDate: '2025-02-15',
      endDate: '2025-02-15',
      startTime: '08:30',
      endTime: '12:30',
      reason: null,
    });
  });

  it('should extract ProblemDetails error message on HTTP failure', () => {
    component.ngOnInit();
    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(
      throwError(() => ({
        error: { detail: 'موجودی مرخصی شما کافی نیست.' },
      }))
    );
    component.setLeaveType('daily');
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
    });

    component.onSubmit();

    expect(component.formError()).toBe('موجودی مرخصی شما کافی نیست.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should display appropriate Persian message on 401, 403, and network errors', () => {
    component.ngOnInit();
    component.setLeaveType('daily');
    component.form.patchValue({
      leaveCategoryId: 'cat-1',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
    });

    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(throwError(() => ({ status: 401 })));
    component.onSubmit();
    expect(component.formError()).toBe('شما وارد سیستم نشده‌اید. لطفاً مجدداً وارد شوید.');

    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(throwError(() => ({ status: 403 })));
    component.onSubmit();
    expect(component.formError()).toBe('شما دسترسی لازم برای ثبت این درخواست را ندارید.');

    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(throwError(() => ({ status: 0 })));
    component.onSubmit();
    expect(component.formError()).toBe('عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
  });

  it('should prevent duplicate submissions while submitting', () => {
    component.ngOnInit();
    leaveRequestServiceMock.createLeaveRequest.mockReturnValue(of({ id: 'req-3' }));
    component.setLeaveType('daily');
    component.form.patchValue({
      startDate: '2025-02-10',
      endDate: '2025-02-12',
    });

    component.isSubmitting.set(true);
    component.onSubmit();

    expect(leaveRequestServiceMock.createLeaveRequest).not.toHaveBeenCalled();
  });
});
