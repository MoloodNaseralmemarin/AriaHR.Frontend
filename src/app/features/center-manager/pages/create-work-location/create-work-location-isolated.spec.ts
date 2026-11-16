import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { NonNullableFormBuilder, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CreateWorkLocationComponent } from './create-work-location.component';
import { WorkLocationService } from '../../services/work-location.service';
import { AuthService } from '../../../../core/auth/auth.service';

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
      })
    ),
    generateQrCode: vi.fn().mockReturnValue(
      of({
        token: 'sample-token-code',
        expiresAtUtc: '2026-10-03T12:00:00Z',
      })
    ),
    reverseGeocode: vi.fn().mockReturnValue(of('آدرس تست')),
  };

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({
      id: 'usr-1',
      organizationId: 'org-1',
    }),
    getCurrentUser: vi.fn().mockReturnValue(of(null)),
  };

  function createComponent(): CreateWorkLocationComponent {
    const fb = new FormBuilder().nonNullable;
    const injector = Injector.create({
      providers: [
        { provide: NonNullableFormBuilder, useValue: fb },
        { provide: WorkLocationService, useValue: mockWorkLocationService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    let comp!: CreateWorkLocationComponent;
    runInInjectionContext(injector, () => {
      comp = new CreateWorkLocationComponent();
    });
    return comp;
  }

  it('should store createdWorkLocationId when createWorkLocation succeeds', () => {
    const comp = createComponent();
    comp.form.controls.name.setValue('دفتر مرکزی');
    comp.selectLocation(35.7, 51.3);
    comp.onSubmit();

    expect(comp.createdWorkLocationId()).toBe('wl-123');
    expect(comp.showSuccessToast()).toBe(true);
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
    });
  });

  it('should not post a duplicate record when the form is submitted twice', () => {
    mockWorkLocationService.createWorkLocation.mockClear();
    const comp = createComponent();
    comp.form.controls.name.setValue('دفتر مرکزی');
    comp.selectLocation(35.7, 51.3);

    comp.onSubmit();
    comp.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).toHaveBeenCalledTimes(1);
  });

  it('should keep the saved point and block further changes until a new registration starts', () => {
    const comp = createComponent();
    comp.form.controls.name.setValue('دفتر مرکزی');
    comp.selectLocation(35.7, 51.3);
    comp.onSubmit();

    comp.selectLocation(36.1, 52.1);
    expect(comp.selectedLocation()).toEqual({ lat: 35.7, lng: 51.3 });

    comp.startNewRegistration();
    expect(comp.selectedLocation()).toBeNull();
    expect(comp.isSubmitted()).toBe(false);
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

  it('should reject out-of-range coordinates before calling the API', () => {
    mockWorkLocationService.createWorkLocation.mockClear();
    const comp = createComponent();
    comp.form.controls.name.setValue('دفتر مرکزی');
    (comp as any).selectedLocation.set({ lat: 120, lng: 51.3 });

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

  describe('map viewport defaults', () => {
    it('should create the map centered on Hamedan at city zoom', async () => {
      const created: { element: unknown; options: any }[] = [];
      const mapStub = {
        on: vi.fn(),
        remove: vi.fn(),
        setView: vi.fn(),
        flyTo: vi.fn(),
      };

      (globalThis as any).L = {
        map: (element: unknown, options: any) => {
          created.push({ element, options });
          return mapStub;
        },
      };

      try {
        const comp = createComponent();
        comp.mapContainer = { nativeElement: {} } as any;
        comp.ngAfterViewInit();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(created).toHaveLength(1);
        // Hamedan city, not the previously hardcoded Tehran viewport.
        expect(created[0].options.center).toEqual([34.7983, 48.5147]);
        expect(created[0].options.zoom).toBe(13);
        expect(created[0].options.key).toBeTruthy();
        expect(comp.mapError()).toBeNull();
        expect(comp.isMapLoading()).toBe(false);
      } finally {
        delete (globalThis as any).L;
      }
    });
  });

  describe('current location', () => {
    function stubGeolocation(value: unknown): void {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value,
        configurable: true,
        writable: true,
      });
    }

    it('should mark the detected position with its own dot and accuracy circle', () => {
      let success: ((pos: any) => void) | undefined;
      const getCurrentPosition = vi.fn((onSuccess: (pos: any) => void) => {
        success = onSuccess;
      });
      stubGeolocation({ getCurrentPosition });

      const dotStub = { addTo: vi.fn().mockReturnThis(), setLatLng: vi.fn() };
      const accuracyStub = { addTo: vi.fn().mockReturnThis(), setLatLng: vi.fn(), setRadius: vi.fn() };
      const selectionMarkerSpy = vi.fn();
      (globalThis as any).L = {
        marker: selectionMarkerSpy,
        circleMarker: vi.fn(() => dotStub),
        circle: vi.fn(() => accuracyStub),
      };

      try {
        const comp = createComponent();
        const mapStub = { flyTo: vi.fn() };
        (comp as any).mapInstance = mapStub;

        comp.useCurrentLocation();

        expect(getCurrentPosition).toHaveBeenCalledTimes(1);
        expect(comp.isLocatingCurrentPosition()).toBe(true);

        success!({ coords: { latitude: 34.806_512, longitude: 48.516_334, accuracy: 15 } });

        expect(comp.isLocatingCurrentPosition()).toBe(false);
        expect(comp.locationError()).toBeNull();
        expect(mapStub.flyTo).toHaveBeenCalledWith([34.806512, 48.516334], 16, expect.any(Object));

        // Dedicated blue dot for "where I am"...
        expect((globalThis as any).L.circleMarker).toHaveBeenCalledWith(
          [34.806512, 48.516334],
          expect.objectContaining({ fillColor: '#2563eb', fillOpacity: 1 })
        );
        // ...and an accuracy circle sized from position.coords.accuracy.
        expect((globalThis as any).L.circle).toHaveBeenCalledWith(
          [34.806512, 48.516334],
          expect.objectContaining({ radius: 15 })
        );
        // The draggable selection marker stays where the user left it.
        expect(selectionMarkerSpy).not.toHaveBeenCalled();
        expect(comp.selectedLocation()).toBeNull();
      } finally {
        delete (globalThis as any).L;
      }
    });

    it('should ask the user to allow location access when permission is denied', () => {
      let failure: ((err: any) => void) | undefined;
      stubGeolocation({
        getCurrentPosition: vi.fn((_s: unknown, onError: (err: any) => void) => {
          failure = onError;
        }),
      });

      const comp = createComponent();
      comp.useCurrentLocation();
      failure!({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });

      expect(comp.isLocatingCurrentPosition()).toBe(false);
      expect(comp.selectedLocation()).toBeNull();
      expect(comp.locationError()).toContain('تنظیمات مرورگر');
    });

    it('should show a friendly message when the position is unavailable', () => {
      let failure: ((err: any) => void) | undefined;
      stubGeolocation({
        getCurrentPosition: vi.fn((_s: unknown, onError: (err: any) => void) => {
          failure = onError;
        }),
      });

      const comp = createComponent();
      comp.useCurrentLocation();
      failure!({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });

      expect(comp.locationError()).toContain('در دسترس نیست');
      expect(comp.selectedLocation()).toBeNull();
    });

    it('should show a retry message when detection times out', () => {
      let failure: ((err: any) => void) | undefined;
      stubGeolocation({
        getCurrentPosition: vi.fn((_s: unknown, onError: (err: any) => void) => {
          failure = onError;
        }),
      });

      const comp = createComponent();
      comp.useCurrentLocation();
      failure!({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });

      expect(comp.locationError()).toContain('زمان دریافت موقعیت مکانی');
      expect(comp.isLocatingCurrentPosition()).toBe(false);
    });

    it('should report unsupported browsers instead of throwing', () => {
      stubGeolocation(undefined);

      const comp = createComponent();
      comp.useCurrentLocation();

      expect(comp.locationError()).toContain('پشتیبانی نمی‌کند');
      expect(comp.isLocatingCurrentPosition()).toBe(false);
    });

    it('should ignore repeated clicks while a detection is in progress', () => {
      const getCurrentPosition = vi.fn();
      stubGeolocation({ getCurrentPosition });

      const comp = createComponent();
      comp.useCurrentLocation();
      comp.useCurrentLocation();

      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });
  });
});
