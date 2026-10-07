import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from '../models/create-employee.dto';
import { UpdateEmployeeDto } from '../models/update-employee.dto';
import { of } from 'rxjs';

describe('EmployeeService (Isolated Unit Tests)', () => {
  function createServiceWithSpyHttpClient() {
    let capturedMethod = '';
    let capturedUrl = '';
    let capturedBody: any = null;

    const mockHttp = {
      get: vi.fn((url: string) => {
        capturedMethod = 'GET';
        capturedUrl = url;
        return of([]);
      }),
      post: vi.fn((url: string, body: any) => {
        capturedMethod = 'POST';
        capturedUrl = url;
        capturedBody = body;
        return of({ id: 'emp-1' });
      }),
      put: vi.fn((url: string, body: any) => {
        capturedMethod = 'PUT';
        capturedUrl = url;
        capturedBody = body;
        return of({ id: 'emp-1' });
      }),
      delete: vi.fn((url: string) => {
        capturedMethod = 'DELETE';
        capturedUrl = url;
        return of(null);
      }),
    };

    const customInjector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
      ],
    });

    let service!: EmployeeService;
    runInInjectionContext(customInjector, () => {
      service = new EmployeeService();
    });

    return {
      service,
      mockHttp,
      getCaptured: () => ({ method: capturedMethod, url: capturedUrl, body: capturedBody }),
    };
  }

  it('should create employee without image using FormData', () => {
    const { service, getCaptured } = createServiceWithSpyHttpClient();
    const createDto: CreateEmployeeDto = {
      firstName: 'علی',
      lastName: 'علوی',
      phoneNumber: '09121234567',
      organizationId: 'org-1',
      personnelCode: '1001',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    };

    service.createEmployee(createDto).subscribe();

    const captured = getCaptured();
    expect(captured.method).toBe('POST');
    expect(captured.body instanceof FormData).toBe(true);

    const formData = captured.body as FormData;
    expect(formData.get('firstName')).toBe('علی');
    expect(formData.get('phoneNumber')).toBe('09121234567');
    expect(formData.has('profileImage')).toBe(false);
  });

  it('should create employee with image file using FormData', () => {
    const { service, getCaptured } = createServiceWithSpyHttpClient();
    const dummyFile = new File(['avatar content'], 'avatar.png', { type: 'image/png' });
    const createDto: CreateEmployeeDto = {
      firstName: 'رضا',
      lastName: 'رضایی',
      phoneNumber: '09129876543',
      organizationId: 'org-1',
      personnelCode: '1002',
      nationalCode: '0987654321',
      birthDate: '1995-05-05',
      hireDate: '2023-01-01',
      profileImage: dummyFile,
    };

    service.createEmployee(createDto).subscribe();

    const captured = getCaptured();
    expect(captured.method).toBe('POST');
    const formData = captured.body as FormData;
    expect(formData.get('profileImage')).toEqual(dummyFile);
  });

  it('should update employee without changing image (removeProfileImage = false)', () => {
    const { service, getCaptured } = createServiceWithSpyHttpClient();
    const updateDto: UpdateEmployeeDto = {
      organizationId: 'org-1',
      personnelCode: '1001',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
      isActive: true,
      removeProfileImage: false,
    };

    service.updateEmployee('emp-1', updateDto).subscribe();

    const captured = getCaptured();
    expect(captured.method).toBe('PUT');
    const formData = captured.body as FormData;
    expect(formData.get('removeProfileImage')).toBe('false');
    expect(formData.has('profileImage')).toBe(false);
  });

  it('should update employee with new image file', () => {
    const { service, getCaptured } = createServiceWithSpyHttpClient();
    const newFile = new File(['new image content'], 'new-avatar.jpg', { type: 'image/jpeg' });
    const updateDto: UpdateEmployeeDto = {
      organizationId: 'org-1',
      personnelCode: '1001',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
      isActive: true,
      profileImage: newFile,
      removeProfileImage: false,
    };

    service.updateEmployee('emp-1', updateDto).subscribe();

    const captured = getCaptured();
    expect(captured.method).toBe('PUT');
    const formData = captured.body as FormData;
    expect(formData.get('profileImage')).toEqual(newFile);
    expect(formData.get('removeProfileImage')).toBe('false');
  });

  it('should update employee with removeProfileImage = true', () => {
    const { service, getCaptured } = createServiceWithSpyHttpClient();
    const updateDto: UpdateEmployeeDto = {
      organizationId: 'org-1',
      personnelCode: '1001',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
      isActive: true,
      removeProfileImage: true,
    };

    service.updateEmployee('emp-1', updateDto).subscribe();

    const captured = getCaptured();
    expect(captured.method).toBe('PUT');
    const formData = captured.body as FormData;
    expect(formData.get('removeProfileImage')).toBe('true');
    expect(formData.has('profileImage')).toBe(false);
  });
});
