import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { EmployeeFormComponent } from './employee-form.component';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { EmployeeResponseDto } from '../../models/employee-response.dto';

describe('EmployeeFormComponent', () => {
  let component: EmployeeFormComponent;
  let fixture: ComponentFixture<EmployeeFormComponent>;
  let router: Router;

  const mockEmployee: EmployeeResponseDto = {
    id: 'emp-1',
    userId: 'user-1',
    organizationId: 'org-1',
    personnelCode: '1001',
    nationalCode: '1234567890',
    birthDate: '1990-01-01',
    hireDate: '2022-01-01',
    isActive: true,
  };

  const mockEmployeeService = {
    getEmployeeById: vi.fn().mockReturnValue(of(mockEmployee)),
    createEmployee: vi.fn().mockReturnValue(of(mockEmployee)),
    updateEmployee: vi.fn().mockReturnValue(of(mockEmployee)),
  };

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({
      id: 'usr-1',
      firstName: 'مدیر',
      lastName: 'مرکز',
      organizationId: 'org-1',
      roles: ['CenterManager'],
    }),
    getCurrentUser: vi.fn().mockReturnValue(of(null)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [EmployeeFormComponent],
      providers: [
        provideRouter([]),
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(EmployeeFormComponent);
    component = fixture.componentInstance;
  });

  it('should create component in create mode', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBe(false);
  });

  it('should validate form fields on submit', () => {
    fixture.detectChanges();
    component.submit();
    expect(component.form.invalid).toBe(true);
    expect(mockEmployeeService.createEmployee).not.toHaveBeenCalled();
  });

  it('should submit valid form in create mode', () => {
    fixture.detectChanges();
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.form.patchValue({
      userId: 'user-123',
      personnelCode: '1002',
      nationalCode: '0012345678',
      birthDate: '1995-05-05',
      hireDate: '2023-01-01',
    });

    component.submit();

    expect(mockEmployeeService.createEmployee).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/center-manager/employees']);
  });

  it('should display error message on submit failure', () => {
    mockEmployeeService.createEmployee.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'کد ملی تکراری است.' } }))
    );
    fixture.detectChanges();

    component.form.patchValue({
      userId: 'user-123',
      personnelCode: '1002',
      nationalCode: '0012345678',
      birthDate: '1995-05-05',
      hireDate: '2023-01-01',
    });

    component.submit();

    expect(component.errorMessage()).toBe('کد ملی تکراری است.');
  });
});
