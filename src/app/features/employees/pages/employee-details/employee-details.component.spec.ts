import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { EmployeeDetailsComponent } from './employee-details.component';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeResponseDto } from '../../models/employee-response.dto';

describe('EmployeeDetailsComponent', () => {
  let component: EmployeeDetailsComponent;
  let fixture: ComponentFixture<EmployeeDetailsComponent>;

  const mockEmployee: EmployeeResponseDto = {
    id: 'emp-1',
    userId: 'user-1',
    organizationId: 'org-1',
    personnelCode: '1001',
    nationalCode: '1234567890',
    birthDate: '1990-01-01',
    hireDate: '2022-01-01',
    isActive: true,
    userFullName: 'علی علوی',
  };

  const mockEmployeeService = {
    getEmployeeById: vi.fn().mockReturnValue(of(mockEmployee)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [EmployeeDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: EmployeeService, useValue: mockEmployeeService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'emp-1',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create component and load employee details', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockEmployeeService.getEmployeeById).toHaveBeenCalledWith('emp-1');
    expect(component.employee()?.personnelCode).toBe('1001');
  });

  it('should handle error when employee details fail to load', () => {
    mockEmployeeService.getEmployeeById.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'کارمند یافت نشد.' } }))
    );
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('کارمند یافت نشد.');
  });
});
