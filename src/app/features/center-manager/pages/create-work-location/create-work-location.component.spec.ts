import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, beforeEach, it, expect, vi } from 'vitest';

import { CreateWorkLocationComponent } from './create-work-location.component';
import { WorkLocationService } from '../../services/work-location.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

describe('CreateWorkLocationComponent', () => {
  let component: CreateWorkLocationComponent;
  let fixture: ComponentFixture<CreateWorkLocationComponent>;

  let mockWorkLocationService: Partial<WorkLocationService>;
  let notificationService: { showSuccess: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  const originalMapKey = environment.neshanMapApiKey;

  beforeEach(async () => {
    // Keep the Leaflet SDK out of jsdom; the map component renders its
    // configuration error instead of loading external scripts.
    environment.neshanMapApiKey = '';

    mockWorkLocationService = {
      createWorkLocation: vi.fn().mockReturnValue(
        of({
          id: 'wl-1',
          organizationId: 'org-123',
          name: 'دفتر مرکزی',
          latitude: 35.7219,
          longitude: 51.3347,
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
          workLocationId: 'wl-1',
          qrCodeMode: 'Static',
          token: 'sample-qr-token',
          expiresAtUtc: null,
          refreshAfterUtc: null,
          generatedAtUtc: '2026-10-03T12:00:00Z',
          qrCodeEnabled: true,
          rotationIntervalMinutes: 5,
        })
      ),
      hasReverseGeocodingKey: true,
      reverseGeocode: vi.fn().mockReturnValue(of('تهران، خیابان ولیعصر')),
    };

    notificationService = { showSuccess: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateWorkLocationComponent],
      providers: [
        provideRouter([]),
        { provide: WorkLocationService, useValue: mockWorkLocationService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compileComponents();

    navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    fixture = TestBed.createComponent(CreateWorkLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    environment.neshanMapApiKey = originalMapKey;
  });

  it('should create component and initialize default form values', () => {
    expect(component).toBeTruthy();
    expect(component.form.controls.radiusInMeters.value).toBe(200);
    expect(component.form.controls.isActive.value).toBe(true);
    expect(component.selectedLocation()).toBeNull();
  });

  it('should validate name and radius controls correctly', () => {
    const nameCtrl = component.form.controls.name;
    expect(nameCtrl.invalid).toBe(true);

    nameCtrl.setValue('   ');
    expect(nameCtrl.invalid).toBe(true);

    nameCtrl.setValue('دفتر مرکزی');
    expect(nameCtrl.valid).toBe(true);

    const radiusCtrl = component.form.controls.radiusInMeters;
    radiusCtrl.setValue(0);
    expect(radiusCtrl.invalid).toBe(true);

    radiusCtrl.setValue(-10);
    expect(radiusCtrl.invalid).toBe(true);

    radiusCtrl.setValue(150);
    expect(radiusCtrl.valid).toBe(true);
  });

  it('should store the selected location from the map', () => {
    component.onLocationSelected({ lat: 35.7219, lng: 51.3347 });

    expect(component.selectedLocation()).toEqual({ lat: 35.7219, lng: 51.3347 });
  });

  it('should require selecting a location before submission', () => {
    component.form.controls.name.setValue('دفتر مرکزی');
    component.onSubmit();

    expect(component.errorMessage()).toBe('لطفاً ابتدا محل مرکز را روی نقشه انتخاب کنید.');
    expect(mockWorkLocationService.createWorkLocation).not.toHaveBeenCalled();
  });

  it('should submit the backend CreateWorkLocationRequest without an organizationId', () => {
    component.form.controls.name.setValue('  دفتر مرکزی  ');
    component.form.controls.radiusInMeters.setValue(200);
    component.onLocationSelected({ lat: 35.7219, lng: 51.3347 });
    component.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).toHaveBeenCalledWith({
      name: 'دفتر مرکزی',
      latitude: 35.7219,
      longitude: 51.3347,
      allowedRadiusInMeters: 200,
      isActive: true,
    });
    expect(component.submitState()).toBe('success');
    expect(component.createdWorkLocationId()).toBe('wl-1');
    expect(notificationService.showSuccess).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/center-manager/work-locations']);
  });

  it('should not post twice while a submission is in flight or after success', () => {
    component.form.controls.name.setValue('دفتر مرکزی');
    component.onLocationSelected({ lat: 35.7219, lng: 51.3347 });

    component.onSubmit();
    component.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).toHaveBeenCalledTimes(1);
  });

  it('should show backend ProblemDetails validation errors per field in Persian', () => {
    vi.mocked(mockWorkLocationService.createWorkLocation!).mockReturnValue(
      throwError(() => ({
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          detail: 'One or more validation errors occurred.',
          errors: {
            '$.name': ['The Name field is required.'],
            AllowedRadiusInMeters: [
              'The field AllowedRadiusInMeters must be between 1 and 1000.',
            ],
          },
        },
      }))
    );

    component.form.controls.name.setValue('دفتر مرکزی');
    component.onLocationSelected({ lat: 35.7219, lng: 51.3347 });
    component.onSubmit();

    expect(component.submitState()).toBe('error');
    expect(component.fieldError('name')).toBe('نام محل کار الزامی است.');
    expect(component.fieldError('radiusInMeters')).toBe(
      'شعاع محدوده باید بین ۱ تا ۱٬۰۰۰ متر باشد.'
    );
    expect(component.errorMessage()).toBe(
      'اطلاعات محل کار معتبر نیست. مقادیر مشخص‌شده را اصلاح و دوباره تلاش کنید.'
    );
    expect(component.isSubmitted()).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should generate a QR code and open the modal with mode data', () => {
    component.createdWorkLocationId.set('wl-1');
    component.onGenerateQrCode();

    expect(mockWorkLocationService.generateQrCode).toHaveBeenCalledWith('wl-1');
    expect(component.showQrModal()).toBe(true);
    expect(component.qrData()).toEqual({
      code: 'sample-qr-token',
      expiresAtUtc: null,
      qrCodeMode: 'Static',
    });
  });

  it('should handle generateQrCode API errors gracefully', () => {
    vi.mocked(mockWorkLocationService.generateQrCode!).mockReturnValue(
      throwError(() => ({ status: 404, error: { message: 'محل کار یافت نشد.' } }))
    );

    component.createdWorkLocationId.set('wl-999');
    component.onGenerateQrCode();

    expect(component.showQrModal()).toBe(false);
    expect(component.errorMessage()).toBe('محل کار یافت نشد.');
  });

  it('should handle API errors during submission gracefully', () => {
    vi.mocked(mockWorkLocationService.createWorkLocation!).mockReturnValue(
      throwError(() => ({ error: { message: 'محل کار تکراری است.' } }))
    );

    component.form.controls.name.setValue('دفتر مرکزی');
    component.onLocationSelected({ lat: 35.7219, lng: 51.3347 });
    component.onSubmit();

    expect(component.submitState()).toBe('error');
    expect(component.errorMessage()).toBe('محل کار تکراری است.');
    expect(component.isSubmitted()).toBe(false);
  });
});
