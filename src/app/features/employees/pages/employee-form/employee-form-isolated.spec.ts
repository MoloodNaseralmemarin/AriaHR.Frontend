import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { NonNullableFormBuilder, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

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
});
