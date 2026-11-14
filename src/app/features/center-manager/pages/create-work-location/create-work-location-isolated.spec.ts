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
        latitude: 35.7,
        longitude: 51.3,
        radiusInMeters: 200,
        isActive: true,
      })
    ),
    generateQrCode: vi.fn().mockReturnValue(
      of({
        code: 'sample-token-code',
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

    it('should move the map to the reported position and select it', () => {
      let success: ((pos: any) => void) | undefined;
      const getCurrentPosition = vi.fn((onSuccess: (pos: any) => void) => {
        success = onSuccess;
      });
      stubGeolocation({ getCurrentPosition });

      const markerStub = { addTo: vi.fn().mockReturnThis(), on: vi.fn(), setLatLng: vi.fn() };
      (globalThis as any).L = {
        marker: vi.fn(() => markerStub),
        circle: vi.fn(() => ({ addTo: vi.fn() })),
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
        expect(comp.selectedLocation()).toEqual({ lat: 34.806512, lng: 48.516334 });
        expect(mapStub.flyTo).toHaveBeenCalledWith([34.806512, 48.516334], 16, expect.any(Object));
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
