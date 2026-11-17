import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { NonNullableFormBuilder, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CreateWorkLocationComponent } from './create-work-location.component';
import { WorkLocationService } from '../../services/work-location.service';
import { NotificationService } from '../../../../core/services/notification.service';

describe('CreateWorkLocationComponent (Isolated Unit Tests)', () => {
  const mockWorkLocationService = {
    createWorkLocation: vi.fn().mockReturnValue(
      of({
        id: 'wl-123',
        organizationId: 'org-1',
        name: 'دفتر مرکزی',
        latitude: 35.7,
        longitude: 51.3,
        allowedRadiusInMeters: 200,
        isActive: true,
        qrCodeMode: 'Static',
        qrCodeEnabled: true,
        qrRotationIntervalMinutes: 5,
        createdAtUtc: '2026-10-03T12:00:00Z',
      })
    ),
    generateQrCode: vi.fn().mockReturnValue(
      of({
        workLocationId: 'wl-123',
        qrCodeMode: 'Dynamic',
        token: 'sample-token-code',
        expiresAtUtc: '2026-10-03T12:00:00Z',
        refreshAfterUtc: '2026-10-03T12:05:00Z',
        generatedAtUtc: '2026-10-03T12:00:00Z',
        qrCodeEnabled: true,
        rotationIntervalMinutes: 5,
      })
    ),
  };

  const mockRouter = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  const mockNotificationService = {
    showSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.navigate.mockResolvedValue(true);
  });

  function createComponent(): CreateWorkLocationComponent {
    const fb = new FormBuilder().nonNullable;
    const injector = Injector.create({
      providers: [
        { provide: NonNullableFormBuilder, useValue: fb },
        { provide: WorkLocationService, useValue: mockWorkLocationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    let comp!: CreateWorkLocationComponent;
    runInInjectionContext(injector, () => {
      comp = new CreateWorkLocationComponent();
    });
    return comp;
  }

  function fillValidForm(comp: CreateWorkLocationComponent): void {
    comp.form.controls.name.setValue('دفتر مرکزی');
    comp.onLocationSelected({ lat: 35.7, lng: 51.3 });
  }

  it('should POST the JWT-derived payload and navigate to the list on success', () => {
    const comp = createComponent();
    fillValidForm(comp);
    comp.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).toHaveBeenCalledWith({
      name: 'دفتر مرکزی',
      latitude: 35.7,
      longitude: 51.3,
      allowedRadiusInMeters: 200,
      isActive: true,
    });
    expect(comp.createdWorkLocationId()).toBe('wl-123');
    expect(comp.submitState()).toBe('success');
    expect(mockNotificationService.showSuccess).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/center-manager/work-locations']);
  });

  it('should call generateQrCode and set qrData when onGenerateQrCode is triggered', () => {
    const comp = createComponent();
    comp.createdWorkLocationId.set('wl-123');

    comp.onGenerateQrCode();

    expect(mockWorkLocationService.generateQrCode).toHaveBeenCalledWith('wl-123');
    expect(comp.showQrModal()).toBe(true);
    expect(comp.qrData()).toEqual({
      code: 'sample-token-code',
      expiresAtUtc: '2026-10-03T12:00:00Z',
      qrCodeMode: 'Dynamic',
    });
  });

  it('should not post a duplicate record when the form is submitted twice', () => {
    const comp = createComponent();
    fillValidForm(comp);

    comp.onSubmit();
    comp.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).toHaveBeenCalledTimes(1);
  });

  it('should map a 400 ProblemDetails response onto Persian field errors', () => {
    mockWorkLocationService.createWorkLocation.mockReturnValueOnce(
      throwError(() => ({
        status: 400,
        error: {
          detail: 'One or more validation errors occurred.',
          errors: {
            Name: ['The Name field is required.'],
            Latitude: ['The field Latitude must be between -90 and 90.'],
            UnexpectedField: ['The UnexpectedField field is invalid.'],
          },
        },
      }))
    );

    const comp = createComponent();
    fillValidForm(comp);
    comp.onSubmit();

    expect(comp.submitState()).toBe('error');
    expect(comp.fieldError('name')).toBe('نام محل کار الزامی است.');
    expect(comp.fieldError('latitude')).toContain('عرض جغرافیایی معتبر نیست');
    expect(comp.fieldErrors().general).toBe('The UnexpectedField field is invalid.');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should reset all registration state when a new registration starts', () => {
    const comp = createComponent();
    fillValidForm(comp);
    comp.onSubmit();

    comp.startNewRegistration();

    expect(comp.selectedLocation()).toBeNull();
    expect(comp.isSubmitted()).toBe(false);
    expect(comp.createdWorkLocationId()).toBeNull();
    expect(comp.form.controls.radiusInMeters.value).toBe(200);
    expect(comp.form.controls.name.value).toBe('');
  });

  it('should explain radius validation errors in Persian', () => {
    const comp = createComponent();
    const radius = comp.form.controls.radiusInMeters;

    radius.setValue(0);
    expect(comp.radiusMessage()).toBe('شعاع محدوده باید حداقل ۱ متر باشد.');

    radius.setValue(5000);
    expect(comp.radiusMessage()).toBe('شعاع محدوده نمی‌تواند بیشتر از ۱٬۰۰۰ متر باشد.');

    radius.setValue(250);
    expect(comp.radiusMessage()).toBeNull();
  });

  it('should reject whitespace-only names in Persian', () => {
    const comp = createComponent();
    comp.form.controls.name.setValue('   ');

    expect(comp.form.controls.name.invalid).toBe(true);
    expect(comp.nameMessage()).toBe('نام محل کار الزامی است.');
  });

  it('should reject out-of-range coordinates before calling the API', () => {
    const comp = createComponent();
    comp.form.controls.name.setValue('دفتر مرکزی');
    comp.selectedLocation.set({ lat: 120, lng: 51.3 });

    comp.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).not.toHaveBeenCalled();
    expect(comp.errorMessage()).toContain('عرض جغرافیایی');
  });

  it('should handle generateQrCode 404 error with appropriate Persian error message', () => {
    mockWorkLocationService.generateQrCode.mockReturnValueOnce(
      throwError(() => ({ status: 404, error: { message: 'محل کار یافت نشد.' } }))
    );

    const comp = createComponent();
    comp.createdWorkLocationId.set('wl-404');

    comp.onGenerateQrCode();

    expect(comp.showQrModal()).toBe(false);
    expect(comp.errorMessage()).toBe('محل کار یافت نشد.');
  });
});
