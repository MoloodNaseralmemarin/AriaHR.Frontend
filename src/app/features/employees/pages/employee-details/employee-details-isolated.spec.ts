import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { EmployeeDetailsComponent } from './employee-details.component';
import { EmployeeService } from '../../services/employee.service';

describe('EmployeeDetailsComponent (Isolated Unit Tests)', () => {
  const mockEmployeeService = {
    getEmployeeById: vi.fn(),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: vi.fn().mockReturnValue('emp-1'),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createComponent(): EmployeeDetailsComponent {
    const customInjector = Injector.create({
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { url: '/center-manager/employees/emp-1' } },
      ],
    });

    let comp!: EmployeeDetailsComponent;
    runInInjectionContext(customInjector, () => {
      comp = new EmployeeDetailsComponent();
    });
    return comp;
  }

  it('should return «تعیین نشده» when gender is null or empty', () => {
    const comp = createComponent();
    expect(comp.getGenderLabel(null)).toBe('تعیین نشده');
    expect(comp.getGenderLabel(undefined)).toBe('تعیین نشده');
    expect(comp.getGenderLabel('')).toBe('تعیین نشده');
    expect(comp.getGenderLabel('Male')).toBe('مرد');
    expect(comp.getGenderLabel('Female')).toBe('زن');
  });
});
