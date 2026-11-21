import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { WorkLocationService } from '../../services/work-location.service';
import {
  REVERSE_GEOCODING_NOT_CONFIGURED_MESSAGE,
  describeReverseGeocodeFailure,
  toReverseGeocodeFailure,
} from '../../utils/reverse-geocode.util';
import {
  WORK_LOCATION_ASSET_LOAD_TIMEOUT_MS,
  WORK_LOCATION_CURRENT_LOCATION_ZOOM,
  WORK_LOCATION_DEFAULT_RADIUS_METERS,
  WORK_LOCATION_DEFAULT_ZOOM,
  WORK_LOCATION_GEOLOCATION_TIMEOUT_MS,
  WORK_LOCATION_MAP_CENTER,
  WORK_LOCATION_MAX_RADIUS_METERS,
  WORK_LOCATION_MIN_RADIUS_METERS,
} from '../../utils/work-location.constants';

export interface WorkLocationPoint {
  lat: number;
  lng: number;
}

/**
 * Official Neshan Leaflet SDK (Leaflet 1.9.4 + Neshan map integration).
 * The SDK loads the Neshan basemap itself, so the application must not configure
 * a tile URL by hand (the previous raster.neshan.org host no longer resolves).
 */
const NESHAN_SDK_CSS_URL =
  'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css';
const NESHAN_SDK_JS_URL =
  'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js';

const ADDRESS_UNAVAILABLE_MESSAGE = 'آدرس این نقطه در دسترس نیست.';

declare const L: any;

/**
 * Shared interactive map used by both the create and edit work-location pages.
 *
 * It owns every Leaflet/Neshan concern (asset loading, marker, radius circle,
 * reverse geocoding, browser geolocation and cleanup), so the pages only keep
 * form state. The component is deliberately standalone to keep the lazy-loaded
 * WorkLocations chunk independent from the rest of the center-manager module.
 */
@Component({
  selector: 'app-work-location-map',
  standalone: true,
  templateUrl: './work-location-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkLocationMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  /** Point loaded from the API (edit) or set by the parent after a reset. */
  @Input() initialLocation: WorkLocationPoint | null = null;
  @Input() radiusMeters: number | null = WORK_LOCATION_DEFAULT_RADIUS_METERS;
  @Input() disabled = false;

  @Output() locationChange = new EventEmitter<WorkLocationPoint>();

  private readonly workLocationService = inject(WorkLocationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isMapLoading = signal(true);
  readonly mapError = signal<string | null>(null);
  readonly mapWarning = signal<string | null>(null);
  readonly isResolvingAddress = signal(false);
  readonly resolvedAddress = signal<string | null>(null);
  readonly isLocatingCurrentPosition = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly selectedLocation = signal<WorkLocationPoint | null>(null);

  private mapInstance: any = null;
  private markerInstance: any = null;
  private circleInstance: any = null;
  /** Detected device position — deliberately separate from the draggable selection marker. */
  private currentPositionMarker: any = null;
  private accuracyCircle: any = null;
  private initialized = false;

  private readonly addressRequests = new Subject<WorkLocationPoint | null>();

  constructor() {
    this.addressRequests
      .pipe(
        switchMap((point) => {
          if (!point) {
            return of({ message: null, loading: false });
          }

          this.isResolvingAddress.set(true);
          this.resolvedAddress.set(null);

          // Reverse geocoding requires a "Services" key; a Web Map key is rejected
          // by api.neshan.org, so skip the call and explain why instead of failing
          // silently. The subscription below always clears the loading state.
          if (!this.workLocationService.hasReverseGeocodingKey) {
            return of({ message: REVERSE_GEOCODING_NOT_CONFIGURED_MESSAGE, loading: false });
          }

          return this.workLocationService.reverseGeocode(point.lat, point.lng).pipe(
            map((address) => ({
              message: address ?? ADDRESS_UNAVAILABLE_MESSAGE,
              loading: false,
            })),
            catchError((error: unknown) => {
              // Never swallow the provider's reason: keep the code available in
              // the console for support, and show the user an actionable message
              // (a rejected key scope, quota, network failure, ...).
              const failure = toReverseGeocodeFailure(error);
              console.warn('[work-location-map] reverse geocoding failed:', failure);
              return of({
                message: describeReverseGeocodeFailure(failure, this.currentHostname()),
                loading: false,
              });
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ message, loading }) => {
        this.isResolvingAddress.set(loading);
        this.resolvedAddress.set(message);
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['radiusMeters']) {
      this.updateRadiusCircle(this.radiusMeters);
    }

    if (changes['initialLocation']) {
      this.applyInitialLocation();
    }
  }

  ngOnDestroy(): void {
    this.addressRequests.complete();
    this.destroyMap();
  }

  /** Retries map asset loading after a transient network failure. */
  retryMap(): void {
    this.destroyMap();
    this.initialized = false;
    this.mapWarning.set(null);
    this.initMap();
  }

  /**
   * Moves the map to the browser-reported position and marks it with its own dot
   * and accuracy circle, leaving the selection marker under the user's control.
   */
  useCurrentLocation(): void {
    if (this.disabled || this.isLocatingCurrentPosition()) {
      return;
    }

    this.locationError.set(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationError.set('مرورگر شما از قابلیت موقعیت مکانی پشتیبانی نمی‌کند.');
      return;
    }

    // The Geolocation API is only exposed on secure origins (HTTPS or localhost).
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.locationError.set(
        'دریافت موقعیت مکانی فقط روی اتصال امن (HTTPS) امکان‌پذیر است. لطفاً آدرس سایت را با https باز کنید.'
      );
      return;
    }

    this.isLocatingCurrentPosition.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isLocatingCurrentPosition.set(false);
        const lat = this.roundCoordinate(position.coords.latitude);
        const lng = this.roundCoordinate(position.coords.longitude);

        this.showCurrentPosition(lat, lng, position.coords.accuracy);
        this.focusMapOn(lat, lng, WORK_LOCATION_CURRENT_LOCATION_ZOOM);
      },
      (error) => {
        this.isLocatingCurrentPosition.set(false);

        if (error.code === error.PERMISSION_DENIED) {
          this.locationError.set(
            'دسترسی به موقعیت مکانی رد شده است. برای استفاده از این قابلیت، از تنظیمات مرورگر اجازهٔ دسترسی به موقعیت مکانی را برای این سایت فعال کنید.'
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          this.locationError.set(
            'موقعیت مکانی شما در دسترس نیست. لطفاً اتصال اینترنت یا GPS دستگاه را بررسی کنید.'
          );
        } else if (error.code === error.TIMEOUT) {
          this.locationError.set('زمان دریافت موقعیت مکانی به پایان رسید. لطفاً دوباره تلاش کنید.');
        } else {
          this.locationError.set('دریافت موقعیت مکانی با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: WORK_LOCATION_GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  }

  /** Places (or moves) the selection marker; used by clicks and marker drag. */
  selectLocation(lat: number, lng: number): void {
    if (this.disabled) {
      return;
    }

    const point: WorkLocationPoint = {
      lat: this.roundCoordinate(lat),
      lng: this.roundCoordinate(lng),
    };

    this.selectedLocation.set(point);
    this.drawSelection(point);
    this.resolveAddress(point);
    this.locationChange.emit(point);
  }

  /** Clears the selection and the device-position overlays for a new registration. */
  reset(): void {
    this.clearSelection();
    this.locationError.set(null);

    if (this.mapInstance) {
      if (this.currentPositionMarker) {
        this.mapInstance.removeLayer(this.currentPositionMarker);
        this.currentPositionMarker = null;
      }
      if (this.accuracyCircle) {
        this.mapInstance.removeLayer(this.accuracyCircle);
        this.accuracyCircle = null;
      }
    }
  }

  /** Clears only the selected work location, keeping the map viewport intact. */
  clearSelection(): void {
    if (this.mapInstance) {
      if (this.markerInstance) {
        this.mapInstance.removeLayer(this.markerInstance);
        this.markerInstance = null;
      }
      if (this.circleInstance) {
        this.mapInstance.removeLayer(this.circleInstance);
        this.circleInstance = null;
      }
    }

    this.selectedLocation.set(null);
    this.resolvedAddress.set(null);
    this.isResolvingAddress.set(false);
    this.addressRequests.next(null);
  }

  private applyInitialLocation(): void {
    const point = this.initialLocation;

    if (!point) {
      this.clearSelection();
      return;
    }

    const current = this.selectedLocation();
    if (current && this.isSamePoint(current, point)) {
      return;
    }

    const normalized: WorkLocationPoint = {
      lat: this.roundCoordinate(point.lat),
      lng: this.roundCoordinate(point.lng),
    };

    this.selectedLocation.set(normalized);
    this.drawSelection(normalized);
    this.resolveAddress(normalized);
    this.focusMapOn(normalized.lat, normalized.lng, WORK_LOCATION_CURRENT_LOCATION_ZOOM);
  }

  private resolveAddress(point: WorkLocationPoint): void {
    this.addressRequests.next(point);
  }

  /** Host shown in key-scope errors so the missing domain is obvious. */
  private currentHostname(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.location?.hostname || null;
  }

  private initMap(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.isMapLoading.set(true);
    this.mapError.set(null);

    const apiKey = environment.neshanMapApiKey;
    if (!apiKey) {
      this.initialized = false;
      this.mapError.set(
        'کلید API نقشه نشان تنظیم نشده است. لطفاً کلید neshanMapApiKey را در فایل تنظیمات پروژه وارد کنید.'
      );
      this.isMapLoading.set(false);
      return;
    }

    this.loadNeshanLeafletAssets()
      .then(() => {
        if (!this.mapContainer?.nativeElement) {
          this.isMapLoading.set(false);
          return;
        }

        this.mapInstance = L.map(this.mapContainer.nativeElement, {
          key: apiKey,
          maptype: 'neshan',
          poi: true,
          traffic: false,
          center: WORK_LOCATION_MAP_CENTER,
          zoom: WORK_LOCATION_DEFAULT_ZOOM,
        });

        // The official Neshan SDK renders the Neshan basemap itself (host, tile
        // encoding and styling are owned by the SDK), so no manual tile URL is
        // configured here.
        let tileErrorReported = false;
        this.mapInstance.on('tileerror', () => {
          if (tileErrorReported) {
            return;
          }
          tileErrorReported = true;
          // A tile failure does not make the map unusable: the user can still move
          // the viewport or choose a point. Show a non-blocking warning instead of
          // covering the map with an error overlay.
          this.mapWarning.set(
            'بارگذاری برخی تایل‌های نقشه نشان انجام نشد. دسترسی دامنه یا اتصال شبکه را بررسی کنید.'
          );
        });

        this.mapInstance.on('click', (event: any) => {
          this.selectLocation(event.latlng.lat, event.latlng.lng);
        });

        // A container that was hidden or resized while the SDK loaded keeps a stale
        // size, which shows only part of the map. Recompute once after mounting.
        if (typeof this.mapInstance.invalidateSize === 'function') {
          setTimeout(() => this.mapInstance?.invalidateSize?.(), 0);
        }

        this.isMapLoading.set(false);

        const point = this.selectedLocation();
        if (point) {
          this.drawSelection(point);
          this.focusMapOn(point.lat, point.lng, WORK_LOCATION_CURRENT_LOCATION_ZOOM);
        }
      })
      .catch(() => {
        this.initialized = false;
        this.isMapLoading.set(false);
        this.mapError.set(
          'خطا در بارگذاری نقشه نشان. لطفاً اتصال اینترنت یا تنظیمات کلید API را بررسی کنید.'
        );
      });
  }

  private loadNeshanLeafletAssets(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      const cssId = 'neshan-sdk-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = NESHAN_SDK_CSS_URL;
        document.head.appendChild(link);
      }

      let settled = false;
      const settleResolve = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        if (typeof L === 'undefined') {
          reject(new Error('Neshan SDK did not expose the Leaflet global.'));
          return;
        }
        resolve();
      };
      const settleReject = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        reject(new Error('Neshan SDK assets could not be loaded.'));
      };

      // A previous visit may have left the script tag behind (for example after an
      // SPA navigation) and its `load` event never fires again, so the promise would
      // hang forever. Resolve immediately when the tag already finished loading.
      const timeoutId = window.setTimeout(settleReject, WORK_LOCATION_ASSET_LOAD_TIMEOUT_MS);

      const jsId = 'neshan-sdk-js';
      const existingScript = document.getElementById(jsId) as HTMLScriptElement | null;

      if (existingScript) {
        if (existingScript.getAttribute('data-neshan-loaded') === 'true') {
          settleResolve();
          return;
        }
        existingScript.addEventListener('load', settleResolve);
        existingScript.addEventListener('error', settleReject);
        return;
      }

      const script = document.createElement('script');
      script.id = jsId;
      script.src = NESHAN_SDK_JS_URL;
      script.addEventListener('load', () => {
        script.setAttribute('data-neshan-loaded', 'true');
        settleResolve();
      });
      script.addEventListener('error', settleReject);
      document.head.appendChild(script);
    });
  }

  private drawSelection(point: WorkLocationPoint): void {
    if (!this.mapInstance) {
      return;
    }

    const latLng: [number, number] = [point.lat, point.lng];

    if (this.markerInstance) {
      this.markerInstance.setLatLng(latLng);
    } else {
      this.markerInstance = L.marker(latLng, { draggable: true }).addTo(this.mapInstance);
      this.markerInstance.on('dragend', (event: any) => {
        const position = event.target.getLatLng();
        this.selectLocation(position.lat, position.lng);
      });
    }

    this.updateRadiusCircle(this.radiusMeters);
  }

  private updateRadiusCircle(radius: number | null): void {
    const location = this.selectedLocation();

    if (
      !location ||
      !this.mapInstance ||
      radius === null ||
      !Number.isFinite(radius) ||
      radius < WORK_LOCATION_MIN_RADIUS_METERS ||
      radius > WORK_LOCATION_MAX_RADIUS_METERS
    ) {
      if (this.circleInstance && this.mapInstance) {
        this.mapInstance.removeLayer(this.circleInstance);
        this.circleInstance = null;
      }
      return;
    }

    if (this.circleInstance) {
      this.circleInstance.setLatLng([location.lat, location.lng]);
      this.circleInstance.setRadius(radius);
    } else {
      this.circleInstance = L.circle([location.lat, location.lng], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius,
      }).addTo(this.mapInstance);
    }
  }

  /**
   * Renders the detected position as a blue dot (vector circle marker, so it
   * cannot be confused with the pin icon of the selection marker) plus a circle
   * whose radius is the accuracy reported by the browser.
   */
  private showCurrentPosition(lat: number, lng: number, accuracy: number): void {
    if (!this.mapInstance) {
      return;
    }

    const point: [number, number] = [lat, lng];

    if (this.currentPositionMarker) {
      this.currentPositionMarker.setLatLng(point);
    } else {
      this.currentPositionMarker = L.circleMarker(point, {
        radius: 7,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
        interactive: false,
      }).addTo(this.mapInstance);
    }

    if (Number.isFinite(accuracy) && accuracy > 0) {
      if (this.accuracyCircle) {
        this.accuracyCircle.setLatLng(point);
        this.accuracyCircle.setRadius(accuracy);
      } else {
        this.accuracyCircle = L.circle(point, {
          radius: accuracy,
          color: '#2563eb',
          weight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(this.mapInstance);
      }
    }
  }

  private focusMapOn(lat: number, lng: number, zoom: number): void {
    if (!this.mapInstance) {
      return;
    }

    if (typeof this.mapInstance.flyTo === 'function') {
      this.mapInstance.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
    } else {
      this.mapInstance.setView([lat, lng], zoom);
    }
  }

  private destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
      this.markerInstance = null;
      this.circleInstance = null;
      this.currentPositionMarker = null;
      this.accuracyCircle = null;
    }
  }

  private roundCoordinate(value: number): number {
    return parseFloat(value.toFixed(6));
  }

  private isSamePoint(a: WorkLocationPoint, b: WorkLocationPoint): boolean {
    return a.lat === b.lat && a.lng === b.lng;
  }
}
