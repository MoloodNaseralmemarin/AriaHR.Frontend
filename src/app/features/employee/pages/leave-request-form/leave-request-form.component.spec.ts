import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveRequestFormComponent } from './leave-request-form.component';
import { LeaveRequestService } from '../../services/leave-request.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { of } from 'rxjs';

describe('LeaveRequestFormComponent', () => {
  let component: LeaveRequestFormComponent;
  let leaveRequestServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    leaveRequestServiceMock = {
      createLeaveRequest: vi.fn(),
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
      { provide: Router, useValue: routerMock },
      { provide: PersianDateService, useClass: PersianDateService },
    ], parentInjector);

    runInInjectionContext(injector, () => {
      component = new LeaveRequestFormComponent();
    });
  });

  it('should initialize with daily leave type default', () => {
    expect(component.selectedLeaveType()).toBe('daily');
  });

  it('should switch leave type correctly', () => {
    component.setLeaveType('hourly');
    expect(component.selectedLeaveType()).toBe('hourly');
    expect(component.form.get('leaveType')?.value).toBe('hourly');
  });

  it('should show error when daily dates are missing or invalid', () => {
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
    component.setLeaveType('daily');
    component.form.patchValue({
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      reason: 'استراحت',
    });

    component.onSubmit();

    expect(leaveRequestServiceMock.createLeaveRequest).toHaveBeenCalledWith({
      leaveType: 'daily',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      date: undefined,
      startTime: undefined,
      endTime: undefined,
      reason: 'استراحت',
    });
  });
});
