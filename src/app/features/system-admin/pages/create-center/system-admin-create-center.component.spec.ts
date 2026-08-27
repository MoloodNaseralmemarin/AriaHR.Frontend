import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SystemAdminCreateCenterComponent } from './system-admin-create-center.component';
import { SystemAdminDataService } from '../../services/system-admin-data.service';

describe('SystemAdminCreateCenterComponent', () => {
  let component: SystemAdminCreateCenterComponent;
  let fixture: ComponentFixture<SystemAdminCreateCenterComponent>;
  let mockDataService: { createCenter: any };
  let router: Router;

  beforeEach(async () => {
    mockDataService = {
      createCenter: vi.fn().mockReturnValue(of({ success: true, centerId: 'c10' })),
    };

    await TestBed.configureTestingModule({
      imports: [SystemAdminCreateCenterComponent],
      providers: [
        { provide: SystemAdminDataService, useValue: mockDataService },
        provideRouter([]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(SystemAdminCreateCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('Step 1 valid data moves to Step 2', () => {
    component.form.patchValue({
      centerName: 'کلینیک پارس',
      centerType: 'کلینیک',
      address: 'تهران، خیابان ولیعصر',
      phone: '02188888888',
    });

    component.nextStep();

    expect(component.step()).toBe(2);
  });

  it('Step 1 invalid data stays on Step 1 and marks invalid controls as touched', () => {
    component.form.patchValue({
      centerName: '', // Required
      centerType: '', // Required
    });

    component.nextStep();

    expect(component.step()).toBe(1);
    expect(component.form.get('centerName')?.touched).toBe(true);
    expect(component.form.get('centerType')?.touched).toBe(true);
  });

  it('optional address does not block progression when empty', () => {
    component.form.patchValue({
      centerName: 'مرکز درمانی شفا',
      centerType: 'مرکز درمانی',
      address: '',
      phone: '',
    });

    component.nextStep();

    expect(component.step()).toBe(2);
  });

  it('optional phone does not block progression when empty', () => {
    component.form.patchValue({
      centerName: 'مرکز درمانی شفا',
      centerType: 'مرکز درمانی',
      address: 'خیابان اصلی',
      phone: '',
    });

    component.nextStep();

    expect(component.step()).toBe(2);
  });

  it('invalid phone format is rejected', () => {
    component.form.patchValue({
      centerName: 'مرکز تصویربرداری نور',
      centerType: 'مرکز تصویربرداری',
      phone: '123456', // Invalid phone
    });

    component.nextStep();

    expect(component.step()).toBe(1);
    expect(component.form.get('phone')?.touched).toBe(true);
    expect(component.form.get('phone')?.invalid).toBe(true);
  });

  it('Step 2 Back button returns to Step 1 and preserves form values', () => {
    component.form.patchValue({
      centerName: 'کلینیک آریا',
      centerType: 'کلینیک',
      address: 'خیابان بهار',
      phone: '02122223333',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      managerMobile: '09123456789',
      managerEmail: 'ali@example.com',
    });

    component.nextStep();
    expect(component.step()).toBe(2);

    component.prevStep();
    expect(component.step()).toBe(1);

    expect(component.form.value).toEqual({
      centerName: 'کلینیک آریا',
      centerType: 'کلینیک',
      address: 'خیابان بهار',
      phone: '02122223333',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      managerMobile: '09123456789',
      managerEmail: 'ali@example.com',
    });
  });

  it('invalid managerFirstName is rejected', () => {
    component.form.patchValue({
      centerName: 'کلینیک آریا',
      centerType: 'کلینیک',
    });
    component.nextStep();

    component.form.patchValue({
      managerFirstName: 'آ', // Min 2 chars
      managerLastName: 'محمدی',
      managerMobile: '09121112233',
    });

    component.onSubmit();

    expect(mockDataService.createCenter).not.toHaveBeenCalled();
    expect(component.form.get('managerFirstName')?.invalid).toBe(true);
  });

  it('invalid managerLastName is rejected', () => {
    component.form.patchValue({
      centerName: 'کلینیک آریا',
      centerType: 'کلینیک',
    });
    component.nextStep();

    component.form.patchValue({
      managerFirstName: 'رضا',
      managerLastName: '', // Required
      managerMobile: '09121112233',
    });

    component.onSubmit();

    expect(mockDataService.createCenter).not.toHaveBeenCalled();
    expect(component.form.get('managerLastName')?.invalid).toBe(true);
  });

  it('invalid managerMobile is rejected', () => {
    component.form.patchValue({
      centerName: 'کلینیک آریا',
      centerType: 'کلینیک',
    });
    component.nextStep();

    component.form.patchValue({
      managerFirstName: 'رضا',
      managerLastName: 'محمدی',
      managerMobile: '08121112233', // Must start with 09
    });

    component.onSubmit();

    expect(mockDataService.createCenter).not.toHaveBeenCalled();
    expect(component.form.get('managerMobile')?.invalid).toBe(true);
  });

  it('invalid managerEmail is rejected', () => {
    component.form.patchValue({
      centerName: 'کلینیک آریا',
      centerType: 'کلینیک',
    });
    component.nextStep();

    component.form.patchValue({
      managerFirstName: 'رضا',
      managerLastName: 'محمدی',
      managerMobile: '09121112233',
      managerEmail: 'not-an-email',
    });

    component.onSubmit();

    expect(mockDataService.createCenter).not.toHaveBeenCalled();
    expect(component.form.get('managerEmail')?.invalid).toBe(true);
  });

  it('valid Step 2 submits successfully and navigates to /system-admin/centers', () => {
    component.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerType: 'کلینیک',
      address: 'خیابان آزادی',
      phone: '02166667777',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: 'hosseini@example.com',
    });

    component.nextStep();
    component.onSubmit();

    expect(mockDataService.createCenter).toHaveBeenCalledWith({
      centerName: 'کلینیک سلامت',
      centerType: 'کلینیک',
      address: 'خیابان آزادی',
      phone: '02166667777',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
      managerEmail: 'hosseini@example.com',
    });

    expect(router.navigate).toHaveBeenCalledWith(['/system-admin/centers']);
    expect(component.saving()).toBe(false);
  });

  it('prevent duplicate submission while saving', () => {
    const subject = new Subject<{ success: boolean; centerId: string }>();
    mockDataService.createCenter.mockReturnValue(subject.asObservable());

    component.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerType: 'کلینیک',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
    });

    component.nextStep();
    component.onSubmit();
    expect(component.saving()).toBe(true);

    // Trigger submission second time while saving
    component.onSubmit();
    expect(mockDataService.createCenter).toHaveBeenCalledTimes(1);

    subject.next({ success: true, centerId: 'c10' });
    subject.complete();
    expect(component.saving()).toBe(false);
  });

  it('API error displays errorMessage and returns saving to false', () => {
    mockDataService.createCenter.mockReturnValue(
      throwError(() => new Error('Server error occurred'))
    );

    component.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerType: 'کلینیک',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
    });

    component.nextStep();
    component.onSubmit();

    expect(component.saving()).toBe(false);
    expect(component.errorMessage()).toBe('Server error occurred');
  });

  it('saving returns to false after success', () => {
    component.form.patchValue({
      centerName: 'کلینیک سلامت',
      centerType: 'کلینیک',
      managerFirstName: 'مریم',
      managerLastName: 'حسینی',
      managerMobile: '09129876543',
    });

    component.nextStep();
    component.onSubmit();

    expect(component.saving()).toBe(false);
  });
});
