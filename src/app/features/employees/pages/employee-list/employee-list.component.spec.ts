import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { EmployeeListComponent } from './employee-list.component';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { EmployeeResponseDto } from '../../models/employee-response.dto';
import { PagedResponseDto } from '../../../../shared/models/paged-response.dto';

describe('EmployeeListComponent', () => {
  let component: EmployeeListComponent;
  let fixture: ComponentFixture<EmployeeListComponent>;

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

  const mockPagedResponse: PagedResponseDto<EmployeeResponseDto> = {
    items: [mockEmployee],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
  };

  const mockEmployeeService = {
    getEmployees: vi.fn().mockReturnValue(of(mockPagedResponse)),
    activateEmployee: vi.fn().mockReturnValue(of({ ...mockEmployee, isActive: true })),
    deactivateEmployee: vi.fn().mockReturnValue(of({ ...mockEmployee, isActive: false })),
    updateEmployee: vi.fn().mockReturnValue(of(mockEmployee)),
    deleteEmployee: vi.fn().mockReturnValue(of(undefined)),
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
      imports: [EmployeeListComponent],
      providers: [
        provideRouter([]),
        { provide: EmployeeService, useValue: mockEmployeeService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeListComponent);
    component = fixture.componentInstance;
  });

  it('should create component and load employees on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockEmployeeService.getEmployees).toHaveBeenCalled();
    expect(component.employees().length).toBe(1);
  });

  it('should handle search input change', () => {
    fixture.detectChanges();
    component.onSearchInput('1001');
    expect(component.searchTerm()).toBe('1001');
    expect(mockEmployeeService.getEmployees).toHaveBeenCalled();
  });

  it('should toggle active status of employee', () => {
    fixture.detectChanges();
    component.toggleActive(mockEmployee);
    expect(mockEmployeeService.deactivateEmployee).toHaveBeenCalledWith('emp-1');
  });

  it('should handle error when loading employees fails', () => {
    mockEmployeeService.getEmployees.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'خطا در شبکه' } }))
    );
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('خطا در شبکه');
  });
});
