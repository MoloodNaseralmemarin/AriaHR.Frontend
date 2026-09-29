import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { EmployeeService } from './employee.service';
import { environment } from '../../../../environments/environment';
import { CreateEmployeeDto } from '../models/create-employee.dto';
import { UpdateEmployeeDto } from '../models/update-employee.dto';
import { EmployeeResponseDto } from '../models/employee-response.dto';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [EmployeeService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get employees list from /api/organizations/employees without query params', () => {
    service.getEmployees().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].personnelCode).toBe('1001');
      expect(res[0].firstName).toBe('علی');
      expect(res[0].lastName).toBe('علوی');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/employees`);
    expect(req.request.method).toBe('GET');
    req.flush([mockEmployee]);
  });

  it('should get employee by id', () => {
    service.getEmployeeById('emp-1').subscribe((res) => {
      expect(res.id).toBe('emp-1');
      expect(res.personnelCode).toBe('1001');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/employees/emp-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEmployee);
  });

  it('should create employee', () => {
    const createDto: CreateEmployeeDto = {
      userId: 'user-1',
      organizationId: 'org-1',
      personnelCode: '1001',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    };

    service.createEmployee(createDto).subscribe((res) => {
      expect(res.id).toBe('emp-1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/employees`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockEmployee);
  });

  it('should update employee', () => {
    const updateDto: UpdateEmployeeDto = {
      organizationId: 'org-1',
      personnelCode: '1001',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
      isActive: false,
    };

    service.updateEmployee('emp-1', updateDto).subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/employees/emp-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockEmployee, isActive: false });
  });

  it('should delete employee', () => {
    service.deleteEmployee('emp-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/employees/emp-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should activate employee', () => {
    service.activateEmployee('emp-1').subscribe((res) => {
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/employees/emp-1/activate`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockEmployee, isActive: true });
  });

  it('should deactivate employee', () => {
    service.deactivateEmployee('emp-1').subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/employees/emp-1/deactivate`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockEmployee, isActive: false });
  });
});
