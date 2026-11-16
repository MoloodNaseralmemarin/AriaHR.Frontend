import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';

import { WorkLocationMapComponent } from './work-location-map.component';
import { WorkLocationService } from '../../services/work-location.service';
import { environment } from '../../../../../environments/environment';

describe('WorkLocationMapComponent (Isolated Unit Tests)', () => {
  const originalMapKey = environment.neshanMapApiKey;
  const originalGeolocation = Object.getOwnPropertyDescriptor(globalThis.navigator, 'geolocation');

  let hasReverseGeocodingKey = true;
  const reverseGeocode = vi.fn().mockReturnValue(of('تهران، خیابان ولیعصر'));
  const workLocationService = {
    get hasReverseGeocodingKey() {
      return hasReverseGeocodingKey;
    },
    reverseGeocode,
  };

  beforeEach(() => {
    environment.neshanMapApiKey = 'test-map-key';
    hasReverseGeocodingKey = true;
    reverseGeocode.mockClear();
    reverseGeocode.mockReturnValue(of('تهران، خیابان ولیعصر'));
  });

  afterEach(() => {
    environment.neshanMapApiKey = originalMapKey;
    delete (globalThis as any).L;
    if (originalGeolocation) {
      Object.defineProperty(globalThis.navigator, 'geolocation', originalGeolocation);
    } else {
      delete (globalThis.navigator as any).geolocation;
    }
  });

  function createComponent(): WorkLocationMapComponent {
    const injector = Injector.create({
      providers: [{ provide: WorkLocationService, useValue: workLocationService }],
    });

    let comp!: WorkLocationMapComponent;
    runInInjectionContext(injector, () => {
      comp = new WorkLocationMapComponent();
    });
    comp.mapContainer = { nativeElement: {} } as any;
    return comp;
  }

  function stubLeaflet(overrides: Record<string, unknown> = {}) {
    const map = {
      on: vi.fn(),
      remove: vi.fn(),
      setView: vi.fn(),
      flyTo: vi.fn(),
      removeLayer: vi.fn(),
      invalidateSize: vi.fn(),
    };
    (globalThis as any).L = {
      map: vi.fn(() => map),
      marker: vi.fn(() => ({
        addTo: vi.fn().mockReturnThis(),
        on: vi.fn(),
        setLatLng: vi.fn(),
      })),
      circle: vi.fn(() => ({
        addTo: vi.fn().mockReturnThis(),
        setLatLng: vi.fn(),
        setRadius: vi.fn(),
      })),
      circleMarker: vi.fn(() => ({
        addTo: vi.fn().mockReturnThis(),
        setLatLng: vi.fn(),
      })),
      ...overrides,
    };
    return { map, L: (globalThis as any).L };
  }

  function stubGeolocation(value: unknown): void {
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value,
      configurable: true,
      writable: true,
    });
  }

  it('should create the map centered on Hamedan at city zoom', async () => {
    const { L } = stubLeaflet();
    const comp = createComponent();

    comp.ngAfterViewInit();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(L.map).toHaveBeenCalledTimes(1);
    const [, options] = L.map.mock.calls[0];
    expect(options.center).toEqual([34.7983, 48.5147]);
    expect(options.zoom).toBe(13);
    expect(options.key).toBe('test-map-key');
    expect(comp.mapError()).toBeNull();
    expect(comp.isMapLoading()).toBe(false);
  });

  it('should place a draggable marker and radius circle, then emit the point', async () => {
    const { L } = stubLeaflet();
    const comp = createComponent();
    comp.ngAfterViewInit();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const emitted = vi.fn();
    comp.locationChange.subscribe(emitted);
    comp.selectLocation(35.721_912_3, 51.334_712_3);

    expect(comp.selectedLocation()).toEqual({ lat: 35.721912, lng: 51.334712 });
    expect(L.marker).toHaveBeenCalledWith([35.721912, 51.334712], { draggable: true });
    expect(L.circle).toHaveBeenCalledWith(
      [35.721912, 51.334712],
      expect.objectContaining({ radius: 200, fillOpacity: 0.2 })
    );
    expect(emitted).toHaveBeenCalledWith({ lat: 35.721912, lng: 51.334712 });
    expect(reverseGeocode).toHaveBeenCalledWith(35.721912, 51.334712);
    expect(comp.resolvedAddress()).toBe('تهران، خیابان ولیعصر');
  });

  it('should update the circle when the radius changes', async () => {
    const circle = {
      addTo: vi.fn().mockReturnThis(),
      setLatLng: vi.fn(),
      setRadius: vi.fn(),
    };
    stubLeaflet({ circle: vi.fn(() => circle) });
    const comp = createComponent();
    comp.ngAfterViewInit();
    await new Promise((resolve) => setTimeout(resolve, 0));

    comp.selectLocation(35.7, 51.3);
    comp.radiusMeters = 450;
    comp.ngOnChanges({
      radiusMeters: {
        currentValue: 450,
        previousValue: 200,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(circle.setRadius).toHaveBeenCalledWith(450);
  });

  it('should apply an initial location loaded from the API', async () => {
    stubLeaflet();
    const comp = createComponent();
    comp.ngAfterViewInit();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const map = (globalThis as any).L.map.mock.results[0].value;
    comp.initialLocation = { lat: 35.7219, lng: 51.3347 };
    comp.ngOnChanges({
      initialLocation: {
        currentValue: comp.initialLocation,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(comp.selectedLocation()).toEqual({ lat: 35.7219, lng: 51.3347 });
    expect(map.flyTo).toHaveBeenCalledWith([35.7219, 51.3347], 16, expect.any(Object));
  });

  it('should explain a missing reverse-geocoding key instead of calling the API', async () => {
    hasReverseGeocodingKey = false;
    stubLeaflet();
    const comp = createComponent();
    comp.ngAfterViewInit();
    await new Promise((resolve) => setTimeout(resolve, 0));

    comp.selectLocation(35.7, 51.3);

    expect(reverseGeocode).not.toHaveBeenCalled();
    expect(comp.resolvedAddress()).toContain('Reverse Geocoding');
  });

  it('should mark the device position with a dot and accuracy circle without moving the selection', async () => {
    let success: ((position: any) => void) | undefined;
    const getCurrentPosition = vi.fn((onSuccess: (position: any) => void) => {
      success = onSuccess;
    });
    stubGeolocation({ getCurrentPosition });

    const dot = { addTo: vi.fn().mockReturnThis(), setLatLng: vi.fn() };
    const accuracy = {
      addTo: vi.fn().mockReturnThis(),
      setLatLng: vi.fn(),
      setRadius: vi.fn(),
    };
    const { L } = stubLeaflet({
      circleMarker: vi.fn(() => dot),
      circle: vi.fn(() => accuracy),
    });

    const comp = createComponent();
    comp.ngAfterViewInit();
    await new Promise((resolve) => setTimeout(resolve, 0));

    comp.useCurrentLocation();
    expect(comp.isLocatingCurrentPosition()).toBe(true);

    success!({ coords: { latitude: 34.806_512, longitude: 48.516_334, accuracy: 15 } });

    expect(comp.isLocatingCurrentPosition()).toBe(false);
    expect(comp.locationError()).toBeNull();
    expect(L.circleMarker).toHaveBeenCalledWith(
      [34.806512, 48.516334],
      expect.objectContaining({ fillColor: '#2563eb', fillOpacity: 1 })
    );
    expect(L.circle).toHaveBeenCalledWith([34.806512, 48.516334], expect.objectContaining({ radius: 15 }));
    expect(comp.selectedLocation()).toBeNull();
  });

  it('should report unsupported browsers instead of throwing', () => {
    stubGeolocation(undefined);

    const comp = createComponent();
    comp.useCurrentLocation();

    expect(comp.locationError()).toContain('پشتیبانی نمی‌کند');
    expect(comp.isLocatingCurrentPosition()).toBe(false);
  });
});
