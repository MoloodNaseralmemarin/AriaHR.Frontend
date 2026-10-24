import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { SystemAdminCreateCenterComponent } from './system-admin-create-center.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { OrganizationResponseDto } from '../../../organizations/models/organization-response.dto';
import { OrganizationType } from '../../../organizations/models/organization-type.enum';

describe('SystemAdminCreateCenterComponent (Isolated Unit Tests)', () => {
  const mockOrganizationService = {
    createOrganization: vi.fn(),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  const sampleResponse: OrganizationResponseDto = {
    id: 1,
    name: 'کلینیک سلامت',
    code: 'C-101',
    type: OrganizationType.Clinic,
    nationalIdentifier: null,
    phone: '02166667777',
    address: 'خیابان آزادی',
    managerFirstName: 'مریم',
    managerLastName: 'حسینی',
    managerMobile: '09129876543',
    isActive: true,
  };

  function createComponent(): SystemAdminCreateCenterComponent {
    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NonNullableFormBuilder, useValue: new FormBuilder().nonNullable },
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    return runInInjectionContext(injector, () => new SystemAdminCreateCenterComponent());
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationService.createOrganization.mockReturnValue(of(sampleResponse));
  });

  it('Step 1 valid data moves to Step 2', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک پارس',
      centerCode: 'C-101',
      centerType: '1',
      address: 'تهران، خیابان ولیعصر',
      phone: '02188888888',
    });

    comp.nextStep();

    expect(comp.step()).toBe(2);
  });

  it('Step 1 invalid data (missing centerCode) stays on Step 1 and marks invalid controls as touched', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک پارس',
      centerCode: '', // Required
      centerType: '1',
    });

    comp.nextStep();

    expect(comp.step()).toBe(1);
    expect(comp.form.get('centerCode')?.touched).toBe(true);
    expect(comp.form.get('centerCode')?.invalid).toBe(true);
  });

  it('optional address and phone do not block progression when empty', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'مرکز درمانی شفا',
      centerCode: 'MED-202',
      centerType: '2',
      address: '',
      phone: '',
    });

    comp.nextStep();

    expect(comp.step()).toBe(2);
  });

  it('invalid phone format is rejected', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'مرکز تصویربرداری نور',
      centerCode: 'RAD-303',
      centerType: '2',
      phone: '123456', // Invalid landline
    });

    comp.nextStep();

    expect(comp.step()).toBe(1);
    expect(comp.form.get('phone')?.touched).toBe(true);
    expect(comp.form.get('phone')?.invalid).toBe(true);
  });

  it('Step 2 Back button returns to Step 1 and preserves form values', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک آریا',
      centerCode: 'C-101',
      centerType: '1',
      address: 'خیابان بهار',
      phone: '02122223333',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      managerMobile: '09123456789',
      managerEmail: 'ali@example.com',
    });

    comp.nextStep();
    expect(comp.step()).toBe(2);

    comp.prevStep();
    expect(comp.step()).toBe(1);

    expect(comp.form.value).toEqual({
      centerName: 'کلینیک آریا',
      centerCode: 'C-101',
      centerType: '1',
      address: 'خیابان بهار',
      phone: '02122223333',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      managerMobile: '09123456789',
      managerEmail: 'ali@example.com',
    });
  });

  it('invalid manager data is rejected on Step 2 submission', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک آریا',
      centerCode: 'C-101',
      centerType: '1',
    });
    comp.nextStep();

    comp.form.patchValue({
      managerFirstName: 'آ', // Min 2 chars
      managerLastName: '',
      managerMobile: '08121112233', // Invalid prefix
      managerEmail: 'invalid-email',
    });

    comp.onSubmit();

    expect(mockOrganizationService.createOrganization).not.toHaveBeenCalled();
    expect(comp.form.get('managerFirstName')?.invalid).toBe(true);
    expect(comp.form.get('managerLastName')?.invalid).toBe(true);
    expect(comp.form.get('managerMobile')?.invalid).toBe(true);
    expect(comp.form.get('managerEmail')?.invalid).toBe(true);
  });

  it('valid Step 2 submits successfully with numeric type (1 for Clinic) and navigates to /system-admin/centers', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerCode: '  C-101  ',
      centerType: '1',
      address: 'خیابان آزادی',
      phone: '02166667777',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: '  hosseini@example.com  ',
    });

    comp.nextStep();
    comp.onSubmit();

    expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith({
      name: 'کلینیک سلامت',
      code: 'C-101',
      type: OrganizationType.Clinic,
      nationalIdentifier: null,
      phone: '02166667777',
      address: 'خیابان آزادی',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: 'hosseini@example.com',
      isActive: true,
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/system-admin/centers']);
    expect(comp.saving()).toBe(false);
  });

  it('empty managerEmail prevents submission and returns Persian validation error message', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerCode: 'C-101',
      centerType: '1',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: '',
    });

    comp.nextStep();
    comp.onSubmit();

    expect(mockOrganizationService.createOrganization).not.toHaveBeenCalled();
    expect(comp.form.get('managerEmail')?.invalid).toBe(true);
    expect(comp.getControlError('managerEmail')).toBe('ایمیل مدیر الزامی است.');
  });

  it('invalid managerEmail format prevents submission', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerCode: 'C-101',
      centerType: '1',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: 'not-an-email',
    });

    comp.nextStep();
    comp.onSubmit();

    expect(mockOrganizationService.createOrganization).not.toHaveBeenCalled();
    expect(comp.form.get('managerEmail')?.invalid).toBe(true);
    expect(comp.getControlError('managerEmail')).toBe('فرمت ایمیل وارد شده معتبر نیست.');
  });

  it('submits laboratory type (4) correctly in payload', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'آزمایشگاه رازی',
      centerCode: 'LAB-404',
      centerType: '4',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      managerMobile: '09121234567',
      managerEmail: 'ali@example.com',
    });

    comp.nextStep();
    comp.onSubmit();

    expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'LAB-404',
        type: OrganizationType.Laboratory,
        managerEmail: 'ali@example.com',
      })
    );
  });

  it('submits pharmacy type (5) correctly in payload', () => {
    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'داروخانه قانون',
      centerCode: 'PHARM-505',
      centerType: '5',
      managerFirstName: 'رضا',
      managerLastName: 'کمالی',
      managerMobile: '09121234567',
      managerEmail: 'reza@example.com',
    });

    comp.nextStep();
    comp.onSubmit();

    expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'PHARM-505',
        type: OrganizationType.Pharmacy,
        managerEmail: 'reza@example.com',
      })
    );
  });

  it('prevents duplicate submission while saving', () => {
    const subject = new Subject<OrganizationResponseDto>();
    mockOrganizationService.createOrganization.mockReturnValue(subject.asObservable());

    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerCode: 'C-101',
      centerType: '1',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: 'maryam@example.com',
    });

    comp.nextStep();
    comp.onSubmit();
    expect(comp.saving()).toBe(true);

    // Trigger submission second time while saving
    comp.onSubmit();
    expect(mockOrganizationService.createOrganization).toHaveBeenCalledTimes(1);

    subject.next(sampleResponse);
    subject.complete();
    expect(comp.saving()).toBe(false);
  });

  it('API error displays errorMessage and sets saving to false', () => {
    mockOrganizationService.createOrganization.mockReturnValue(
      throwError(() => new Error('Server error occurred'))
    );

    const comp = createComponent();
    comp.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerCode: 'C-101',
      centerType: '1',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: 'maryam@example.com',
    });

    comp.nextStep();
    comp.onSubmit();

    expect(comp.saving()).toBe(false);
    expect(comp.errorMessage()).toBe('Server error occurred');
  });
});
