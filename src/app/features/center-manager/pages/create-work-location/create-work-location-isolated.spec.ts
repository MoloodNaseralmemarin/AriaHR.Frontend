import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { NonNullableFormBuilder, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CreateWorkLocationComponent } from './create-work-location.component';
import { WorkLocationService } from '../../services/work-location.service';
import { AuthService } from '../../../../core/auth/auth.service';
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

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({
      id: 'usr-1',
      organizationId: 'org-1',
    }),
    getCurrentUser: vi.fn().mockReturnValue(of(null)),
  };

  const mockNotificationService = {
    showSuccess: vi.fn(),
  };

  beforeEach(() => {
    mockWorkLocationService.createWorkLocation.mockClear();
    mockWorkLocationService.generateQrCode.mockClear();
    mockNotificationService.showSuccess.mockClear();
    mockAuthService.userDetails.mockReturnValue({ id: 'usr-1', organizationId: 'org-1' });
    mockAuthService.getCurrentUser.mockReturnValue(of(null));
  });

  function createComponent(): CreateWorkLocationComponent {
    const fb = new FormBuilder().nonNullable;
    const injector = Injector.create({
      providers: [
        { provide: NonNullableFormBuilder, useValue: fb },
        { provide: WorkLocationService, useValue: mockWorkLocationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
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

  it('should store createdWorkLocationId when createWorkLocation succeeds', () => {
    const comp = createComponent();
    fillValidForm(comp);
    comp.onSubmit();

    expect(comp.createdWorkLocationId()).toBe('wl-123');
    expect(comp.submitState()).toBe('success');
    expect(mockNotificationService.showSuccess).toHaveBeenCalled();
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

  it('should ask the user to reload when the profile cannot be loaded', () => {
    mockAuthService.userDetails.mockReturnValue(null);
    mockAuthService.getCurrentUser.mockReturnValue(of(null));

    const comp = createComponent();
    fillValidForm(comp);
    comp.onSubmit();

    expect(comp.errorMessage()).toContain('دریافت اطلاعات حساب');
    expect(comp.errorMessage()).not.toContain('هیچ مرکزی');
    expect(mockWorkLocationService.createWorkLocation).not.toHaveBeenCalled();
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
