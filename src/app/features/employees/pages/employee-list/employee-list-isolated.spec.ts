import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { EmployeeListComponent } from './employee-list.component';
import { EmployeeResponseDto } from '../../models/employee-response.dto';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('EmployeeListComponent (Isolated Unit Tests)', () => {
  const mockEmployee: EmployeeResponseDto = {
    id: 'emp-1',
    userId: 'user-1',
    organizationId: 'org-1',
    firstName: 'علی',
    lastName: 'علوی',
    phoneNumber: '09121234567',
    email: 'ali@example.com',
    personnelCode: '1001',
    nationalCode: '1234567890',
    birthDate: '1990-01-01',
    hireDate: '2022-01-01',
    gender: 'Male',
    isActive: true,
  };

  it('should filter employees using Persian or English digits query', () => {
    const injector = createEnvironmentInjector([
      { provide: EmployeeService, useValue: {} },
      { provide: AuthService, useValue: {} },
    ], {} as EnvironmentInjector);

    let comp!: EmployeeListComponent;
    runInInjectionContext(injector, () => {
      comp = new EmployeeListComponent();
    });

    comp.employees.set([mockEmployee]);

    // Search with Persian digits
    comp.onSearchInput('۱۰۰۱');
    expect(comp.filteredEmployees().length).toBe(1);

    // Search with ASCII digits
    comp.onSearchInput('1001');
    expect(comp.filteredEmployees().length).toBe(1);

    // Search with Persian phone digits
    comp.onSearchInput('۰۹۱۲۱۲۳۴۵۶۷');
    expect(comp.filteredEmployees().length).toBe(1);
  });
});
