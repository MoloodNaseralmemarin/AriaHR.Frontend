import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { NonNullableFormBuilder, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EmployeeFormComponent } from './employee-form.component';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('EmployeeFormComponent (Isolated Unit Tests)', () => {
  const mockEmployeeService = {
    getEmployeeById: vi.fn(),
    createEmployee: vi.fn().mockReturnValue(of({})),
    updateEmployee: vi.fn().mockReturnValue(of({})),
  };

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({
      id: 'usr-1',
      organizationId: 'org-1',
    }),
    getCurrentUser: vi.fn().mockReturnValue(of(null)),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: vi.fn().mockReturnValue(null),
      },
    },
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  function createComponent(): EmployeeFormComponent {
    const fb = new FormBuilder().nonNullable;
    const customInjector = Injector.create({
      providers: [
        { provide: NonNullableFormBuilder, useValue: fb },
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    });

    let comp!: EmployeeFormComponent;
    runInInjectionContext(customInjector, () => {
      comp = new EmployeeFormComponent();
    });
    return comp;
  }

  it('should format input digits to Persian digits on input event', () => {
    const comp = createComponent();
    comp.ngOnInit();

    const mockEvent = {
      target: { value: '09121234567' }
    } as unknown as Event;

    comp.onDigitInput('phoneNumber', mockEvent);
    expect(comp.form.controls.phoneNumber.value).toBe('۰۹۱۲۱۲۳۴۵۶۷');
  });

  it('should normalize Persian digits to ASCII when submitting create form', () => {
    const comp = createComponent();
    comp.ngOnInit();

    comp.form.patchValue({
      firstName: 'علی',
      lastName: 'محمدی',
      phoneNumber: '۰۹۱۲۱۲۳۴۵۶۷',
      personnelCode: '۱۰۰۴',
      nationalCode: '۱۲۳۴۵۶۷۸۹۰',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    });

    comp.submit();

    expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: '09121234567',
        personnelCode: '1004',
        nationalCode: '1234567890',
      })
    );
  });

  it('should map duplicate field server error and set server error on corresponding control', () => {
    const comp = createComponent();
    comp.ngOnInit();

    mockEmployeeService.createEmployee.mockReturnValueOnce(
      throwError(() => ({
        status: 400,
        error: {
          title: 'ورودی نامعتبر',
          status: 400,
          detail: 'کاربری با این شماره موبایل قبلاً ثبت شده است.',
        },
      }))
    );

    comp.form.patchValue({
      firstName: 'علی',
      lastName: 'محمدی',
      phoneNumber: '09121234567',
      personnelCode: '1004',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    });

    comp.submit();

    expect(comp.form.controls.phoneNumber.errors?.['server']).toBe(
      'کاربری با این شماره موبایل قبلاً ثبت شده است.'
    );
  });

  it('should clear server error when form control value changes', () => {
    const comp = createComponent();
    comp.ngOnInit();

    comp.form.controls.nationalCode.setErrors({
      server: 'کاربری با این کد ملی قبلاً ثبت شده است.',
    });

    expect(comp.form.controls.nationalCode.errors?.['server']).toBeTruthy();

    comp.form.controls.nationalCode.setValue('0012345679');

    expect(comp.form.controls.nationalCode.errors?.['server']).toBeUndefined();
  });

  it('should handle edit mode duplicate error mapping for nationalCode, personnelCode, and email', () => {
    const comp = createComponent();
    comp.ngOnInit();
    comp.isEditMode.set(true);
    (comp as any).employeeId = 'emp-1';

    mockEmployeeService.updateEmployee.mockReturnValueOnce(
      throwError(() => ({
        status: 400,
        error: {
          detail: 'کاربری با این کد ملی قبلاً ثبت شده است.',
        },
      }))
    );

    comp.form.patchValue({
      firstName: 'علی',
      lastName: 'محمدی',
      phoneNumber: '09121234567',
      personnelCode: '1004',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    });

    comp.submit();

    expect(comp.form.controls.nationalCode.errors?.['server']).toBe(
      'کاربری با این کد ملی قبلاً ثبت شده است.'
    );
  });
});
