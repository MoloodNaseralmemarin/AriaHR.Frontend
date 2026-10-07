import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should create employee without image when no image selected (no validation error)', () => {
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

    expect(comp.imageError()).toBeNull();
    comp.submit();

    expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: '09121234567',
        personnelCode: '1004',
        nationalCode: '1234567890',
        profileImage: null,
      })
    );
  });

  it('should create employee with selected image file', () => {
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

    const dummyFile = new File(['test'], 'profile.png', { type: 'image/png' });
    const fileEvent = {
      target: {
        files: [dummyFile],
      },
    } as unknown as Event;

    comp.onImageSelected(fileEvent);

    expect(comp.selectedProfileImage()).toBe(dummyFile);
    expect(comp.imageError()).toBeNull();

    comp.submit();

    expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        profileImage: dummyFile,
      })
    );
  });

  it('should set validation error for invalid image type and block submission', () => {
    const comp = createComponent();
    comp.ngOnInit();

    const invalidFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
    const fileEvent = {
      target: {
        files: [invalidFile],
        value: 'doc.pdf',
      },
    } as unknown as Event;

    comp.onImageSelected(fileEvent);

    expect(comp.imageError()).toBe('فرمت تصویر باید یکی از موارد JPG، JPEG، PNG یا WEBP باشد.');
    expect(comp.selectedProfileImage()).toBeNull();
  });

  it('should set validation error for image larger than 5 MB and block submission', () => {
    const comp = createComponent();
    comp.ngOnInit();

    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const fileEvent = {
      target: {
        files: [largeFile],
        value: 'large.jpg',
      },
    } as unknown as Event;

    comp.onImageSelected(fileEvent);

    expect(comp.imageError()).toBe('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
    expect(comp.selectedProfileImage()).toBeNull();
  });

  it('should preserve existing image on update when image is unchanged (removeProfileImage = false)', () => {
    const comp = createComponent();
    comp.ngOnInit();
    comp.isEditMode.set(true);
    (comp as any).employeeId = 'emp-1';

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

    expect(mockEmployeeService.updateEmployee).toHaveBeenCalledWith(
      'emp-1',
      expect.objectContaining({
        profileImage: null,
        removeProfileImage: false,
      })
    );
  });

  it('should update employee with new image', () => {
    const comp = createComponent();
    comp.ngOnInit();
    comp.isEditMode.set(true);
    (comp as any).employeeId = 'emp-1';

    comp.form.patchValue({
      firstName: 'علی',
      lastName: 'محمدی',
      phoneNumber: '09121234567',
      personnelCode: '1004',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    });

    const newFile = new File(['test image'], 'photo.jpg', { type: 'image/jpeg' });
    comp.onImageSelected({
      target: { files: [newFile] },
    } as unknown as Event);

    comp.submit();

    expect(mockEmployeeService.updateEmployee).toHaveBeenCalledWith(
      'emp-1',
      expect.objectContaining({
        profileImage: newFile,
        removeProfileImage: false,
      })
    );
  });

  it('should pass removeProfileImage = true on update when user removes existing image', () => {
    const comp = createComponent();
    comp.ngOnInit();
    comp.isEditMode.set(true);
    (comp as any).employeeId = 'emp-1';
    (comp as any).existingImageUrl = '/images/old-avatar.jpg';

    comp.form.patchValue({
      firstName: 'علی',
      lastName: 'محمدی',
      phoneNumber: '09121234567',
      personnelCode: '1004',
      nationalCode: '1234567890',
      birthDate: '1990-01-01',
      hireDate: '2022-01-01',
    });

    comp.removeImage();
    expect(comp.removeProfileImage()).toBe(true);

    comp.submit();

    expect(mockEmployeeService.updateEmployee).toHaveBeenCalledWith(
      'emp-1',
      expect.objectContaining({
        profileImage: null,
        removeProfileImage: true,
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
});
