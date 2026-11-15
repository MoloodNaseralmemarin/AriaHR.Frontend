import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { QrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { environment } from '../../../../../environments/environment';
import { CreateWorkLocationDto } from '../../models/create-work-location.dto';
import { WorkLocationService } from '../../services/work-location.service';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Official Neshan Leaflet SDK (Leaflet 1.9.4 + Neshan map integration).
 * The SDK loads the Neshan basemap itself, so the application must not configure
 * a tile URL by hand (the previous raster.neshan.org host no longer resolves).
 */
const NESHAN_SDK_CSS_URL =
  'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css';
const NESHAN_SDK_JS_URL =
  'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js';

/** Default viewport: Hamedan city, Hamedan Province, Iran. */
const HAMEDAN_CENTER: [number, number] = [34.7983, 48.5147];
const HAMEDAN_DEFAULT_ZOOM = 13;
/** Close enough to distinguish streets once the user's own position is known. */
const CURRENT_LOCATION_ZOOM = 16;
const GEOLOCATION_TIMEOUT_MS = 15000;

/**
 * Backend validation bounds. The server rejects values outside the WGS-84 range,
 * so the form mirrors them to fail fast with a Persian message instead of a 400.
 */
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const MIN_RADIUS_METERS = 1;
const MAX_RADIUS_METERS = 50000;
const DEFAULT_RADIUS_METERS = 200;

const ASSET_LOAD_TIMEOUT_MS = 20000;

declare const L: any;

@Component({
  selector: 'app-create-work-location',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ToastComponent, QrCodeModalComponent],
  templateUrl: './create-work-location.component.html',
  styleUrls: ['./create-work-location.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWorkLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly workLocationService = inject(WorkLocationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessToast = signal(false);

  readonly isMapLoading = signal(true);
  readonly mapError = signal<string | null>(null);
  readonly isResolvingAddress = signal(false);
  readonly resolvedAddress = signal<string | null>(null);

  readonly isLocatingCurrentPosition = signal(false);
  readonly locationError = signal<string | null>(null);

  readonly selectedLocation = signal<{ lat: number; lng: number } | null>(null);

  readonly isSubmitting = computed(() => this.submitState() === 'submitting');
  readonly isSubmitted = computed(() => this.submitState() === 'success');

  readonly createdWorkLocationId = signal<string | null>(null);
  readonly isGeneratingQr = signal(false);
  readonly qrData = signal<{ code: string; expiresAtUtc: string } | null>(null);
  readonly showQrModal = signal(false);

  readonly minRadius = MIN_RADIUS_METERS;
  readonly maxRadius = MAX_RADIUS_METERS;

  readonly form = this.fb.group({
    radiusInMeters: [
      DEFAULT_RADIUS_METERS,
      [Validators.required, Validators.min(MIN_RADIUS_METERS), Validators.max(MAX_RADIUS_METERS)],
    ],
    isActive: [true],
  });

  private mapInstance: any = null;
  private markerInstance: any = null;
  private circleInstance: any = null;
  /** Detected device position — deliberately separate from the draggable selection marker. */
  private currentPositionMarker: any = null;
  private accuracyCircle: any = null;

  ngOnInit(): void {
    this.loadCurrentUserIfMissing();

    this.form.controls.radiusInMeters.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.updateRadiusCircle(val);
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  /**
   * The organization of a work location comes from the authenticated manager's
   * profile (`/api/auth/me`), never from user input, so a manager can only create
   * locations for the center they belong to.
   */
  private loadCurrentUserIfMissing(): Observable<CurrentUserDto | null> {
    const existing = this.authService.userDetails();
    if (existing) {
      return of(existing);
    }

    return this.authService.getCurrentUser();
  }

  private initMap(): void {
    this.isMapLoading.set(true);
    this.mapError.set(null);

    const apiKey = environment.neshanMapApiKey;
    if (!apiKey) {
      this.mapError.set(
        'کلید API نقشه نشان تنظیم نشده است. لطفاً کلید neshanMapApiKey را در فایل تنظیمات پروژه وارد کنید.'
      );
      this.isMapLoading.set(false);
      return;
    }

    this.loadNeshanLeafletAssets()
      .then(() => {
        if (!this.mapContainer || !this.mapContainer.nativeElement) return;

        this.mapInstance = L.map(this.mapContainer.nativeElement, {
          key: apiKey,
          maptype: 'neshan',
          poi: true,
          traffic: false,
          center: HAMEDAN_CENTER,
          zoom: HAMEDAN_DEFAULT_ZOOM,
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
          this.mapError.set(
            'بارگذاری تایل‌های نقشه نشان انجام نشد. دسترسی دامنه یا اتصال شبکه را بررسی کنید.'
          );
        });

        this.mapInstance.on('click', (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6));
          const lng = parseFloat(e.latlng.lng.toFixed(6));
          this.selectLocation(lat, lng);
        });

        // A container that was hidden or resized while the SDK loaded keeps a stale
        // size, which shows only part of the map. Recompute once after mounting.
        if (typeof this.mapInstance.invalidateSize === 'function') {
          setTimeout(() => this.mapInstance?.invalidateSize?.(), 0);
        }

        this.isMapLoading.set(false);
      })
      .catch(() => {
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
      const timeoutId = window.setTimeout(settleReject, ASSET_LOAD_TIMEOUT_MS);

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

  /**
   * Moves the map to the browser-reported position and marks it with its own dot
   * and accuracy circle, leaving the selection marker under the user's control.
   */
  useCurrentLocation(): void {
    if (this.isLocatingCurrentPosition()) {
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
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        // Show the detected position as its own marker instead of moving the
        // draggable selection marker, so "where I am" and "the work location I
        // picked" stay visually distinguishable.
        this.showCurrentPosition(lat, lng, position.coords.accuracy);
        this.focusMapOn(lat, lng, CURRENT_LOCATION_ZOOM);
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
          this.locationError.set(
            'زمان دریافت موقعیت مکانی به پایان رسید. لطفاً دوباره تلاش کنید.'
          );
        } else {
          this.locationError.set('دریافت موقعیت مکانی با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
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

  selectLocation(lat: number, lng: number): void {
    if (this.isSubmitted()) {
      // The current point belongs to a saved location; a new registration must be
      // started explicitly so the same center is never saved twice by accident.
      return;
    }

    this.selectedLocation.set({ lat, lng });

    if (this.mapInstance) {
      if (this.markerInstance) {
        this.markerInstance.setLatLng([lat, lng]);
      } else {
        this.markerInstance = L.marker([lat, lng], { draggable: true }).addTo(this.mapInstance);
        this.markerInstance.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          const dragLat = parseFloat(pos.lat.toFixed(6));
          const dragLng = parseFloat(pos.lng.toFixed(6));
          this.selectLocation(dragLat, dragLng);
        });
      }

      this.updateRadiusCircle(this.form.controls.radiusInMeters.value);
    }

    // Trigger reverse geocoding
    this.resolveAddress(lat, lng);
  }

  private updateRadiusCircle(radius: number | null): void {
    const loc = this.selectedLocation();
    if (
      !loc ||
      !this.mapInstance ||
      radius === null ||
      !Number.isFinite(radius) ||
      radius < MIN_RADIUS_METERS ||
      radius > MAX_RADIUS_METERS
    ) {
      if (this.circleInstance) {
        this.mapInstance?.removeLayer(this.circleInstance);
        this.circleInstance = null;
      }
      return;
    }

    if (this.circleInstance) {
      this.circleInstance.setLatLng([loc.lat, loc.lng]);
      this.circleInstance.setRadius(radius);
    } else {
      this.circleInstance = L.circle([loc.lat, loc.lng], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: radius,
      }).addTo(this.mapInstance);
    }
  }

  private resolveAddress(lat: number, lng: number): void {
    this.isResolvingAddress.set(true);
    this.resolvedAddress.set(null);

    // Reverse geocoding requires a "Services" key; a Web Map key is rejected by
    // api.neshan.org with HTTP 483, so skip the call and say why instead of failing silently.
    if (!this.workLocationService.hasReverseGeocodingKey) {
      this.isResolvingAddress.set(false);
      this.resolvedAddress.set(
        'سرویس تبدیل موقعیت به آدرس فعال نیست؛ کلید سرویس نقشه نشان (Reverse Geocoding) تنظیم نشده است.'
      );
      return;
    }

    this.workLocationService
      .reverseGeocode(lat, lng)
      .pipe(finalize(() => this.isResolvingAddress.set(false)))
      .subscribe({
        next: (addr) => {
          if (addr) {
            this.resolvedAddress.set(addr);
          } else {
            this.resolvedAddress.set('تبدیل موقعیت به آدرس انجام نشد');
          }
        },
        error: () => {
          this.resolvedAddress.set('تبدیل موقعیت به آدرس انجام نشد');
        },
      });
  }

  isControlInvalid(name: 'radiusInMeters'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Persian message for the current radius validation error, if any. */
  radiusMessage(): string | null {
    const control = this.form.controls.radiusInMeters;
    if (control.hasError('required')) {
      return 'وارد کردن شعاع محدودهٔ مجاز الزامی است.';
    }
    if (control.hasError('min')) {
      return 'شعاع محدوده باید حداقل ۱ متر باشد.';
    }
    if (control.hasError('max')) {
      return 'شعاع محدوده نمی‌تواند بیشتر از ۵۰٬۰۰۰ متر باشد.';
    }
    return null;
  }

  private coordinateError(lat: number, lng: number): string | null {
    if (!Number.isFinite(lat) || lat < MIN_LATITUDE || lat > MAX_LATITUDE) {
      return 'عرض جغرافیایی انتخاب‌شده معتبر نیست. لطفاً نقطهٔ دیگری روی نقشه انتخاب کنید.';
    }
    if (!Number.isFinite(lng) || lng < MIN_LONGITUDE || lng > MAX_LONGITUDE) {
      return 'طول جغرافیایی انتخاب‌شده معتبر نیست. لطفاً نقطهٔ دیگری روی نقشه انتخاب کنید.';
    }
    return null;
  }

  onSubmit(): void {
    // Guard against double clicks and duplicate records: a submission that is in
    // flight or already succeeded must not post again.
    if (this.isSubmitting() || this.isSubmitted()) {
      return;
    }

    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loc = this.selectedLocation();
    if (!loc) {
      this.errorMessage.set('لطفاً ابتدا محل مرکز را روی نقشه انتخاب کنید.');
      return;
    }

    const coordinatesError = this.coordinateError(loc.lat, loc.lng);
    if (coordinatesError) {
      this.errorMessage.set(coordinatesError);
      return;
    }

    const value = this.form.getRawValue();
    this.submitState.set('submitting');

    this.loadCurrentUserIfMissing()
      .pipe(
        switchMap((user) => {
          const orgId = user?.organizationId;

          if (!orgId) {
            this.errorMessage.set('شما به هیچ مرکزی متصل نیستید و امکان ثبت محل کار را ندارید.');
            return EMPTY;
          }

          const request: CreateWorkLocationDto = {
            organizationId: orgId,
            latitude: loc.lat,
            longitude: loc.lng,
            radiusInMeters: value.radiusInMeters,
            isActive: value.isActive,
          };

          return this.workLocationService.createWorkLocation(request);
        }),
        finalize(() => {
          if (this.submitState() === 'submitting') {
            this.submitState.set('idle');
          }
        })
      )
      .subscribe({
        next: (res) => {
          this.submitState.set('success');
          this.showSuccessToast.set(true);
          if (res?.id) {
            this.createdWorkLocationId.set(res.id);
          }
        },
        error: (err) => {
          this.submitState.set('error');
          this.errorMessage.set(this.resolveSubmitError(err));
        },
      });
  }

  /** Maps backend/network failures to an actionable Persian message. */
  private resolveSubmitError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'ارتباط با سرور برقرار نشد. اتصال اینترنت یا دسترسی به سرویس را بررسی کنید.';
      }
      // A 2xx/3xx response that is not the expected JSON means the request never
      // reached the API (wrong base URL or a proxy fallback). Never surface the
      // raw parser message to the user.
      if (err.status < 400) {
        return 'پاسخ نامعتبر از سرور دریافت شد. لطفاً تنظیمات آدرس سرویس را بررسی کنید.';
      }
      if (err.status === 401) {
        return 'نشست شما منقضی شده است. لطفاً دوباره وارد حساب خود شوید.';
      }
      if (err.status === 403) {
        return 'دسترسی لازم برای ثبت محل کار در این مرکز را ندارید.';
      }
      if (err.status === 409) {
        return 'این محل کار قبلاً ثبت شده است.';
      }
      if (err.status === 400 || err.status === 422) {
        const validationMessage = this.extractValidationMessage(err.error);
        return validationMessage ?? 'اطلاعات ارسالی نامعتبر است. لطفاً مقادیر فرم را بررسی کنید.';
      }
      if (err.status >= 500) {
        return 'خطا در سرور رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.';
      }
    }

    const body = (err as { error?: unknown } | null)?.error;
    if (body instanceof Error) {
      return 'ثبت محل کار با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
    }

    const message = (body as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return 'ثبت محل کار با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
  }

  /** Supports both `{ message }` and ASP.NET Core `ProblemDetails.errors`. */
  private extractValidationMessage(body: unknown): string | null {
    // Parser/network failures arrive as Error instances and carry no user-facing text.
    if (!body || typeof body !== 'object' || body instanceof Error) {
      return null;
    }

    const record = body as { message?: unknown; errors?: Record<string, unknown> };
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }

    if (record.errors && typeof record.errors === 'object') {
      for (const value of Object.values(record.errors)) {
        if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
          return value[0];
        }
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    }

    return null;
  }

  /** Clears the saved registration so another work location can be added. */
  startNewRegistration(): void {
    this.submitState.set('idle');
    this.errorMessage.set(null);
    this.showSuccessToast.set(false);
    this.createdWorkLocationId.set(null);
    this.qrData.set(null);
    this.showQrModal.set(false);
    this.resolvedAddress.set(null);
    this.isResolvingAddress.set(false);
    this.locationError.set(null);

    this.selectedLocation.set(null);

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

    this.form.reset({ radiusInMeters: DEFAULT_RADIUS_METERS, isActive: true });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onGenerateQrCode(): void {
    const workLocationId = this.createdWorkLocationId();
    if (!workLocationId || this.isGeneratingQr()) return;

    this.isGeneratingQr.set(true);
    this.errorMessage.set(null);

    this.workLocationService
      .generateQrCode(workLocationId)
      .pipe(finalize(() => this.isGeneratingQr.set(false)))
      .subscribe({
        next: (res) => {
          this.qrData.set({
            code: res.code,
            expiresAtUtc: res.expiresAtUtc,
          });
          this.showQrModal.set(true);
        },
        error: (err) => {
          let msg = 'خطا در دریافت QR کد محل کار.';
          if (err?.status === 400) {
            msg = err?.error?.message || 'ورودی نامعتبر / خطای کسب و کار';
          } else if (err?.status === 401) {
            msg = 'احراز هویت مورد نیاز است.';
          } else if (err?.status === 403) {
            msg = 'دسترسی به این محل کار مجاز نیست.';
          } else if (err?.status === 404) {
            msg = 'محل کار یافت نشد.';
          } else if (err?.error?.message) {
            msg = err.error.message;
          }
          this.errorMessage.set(msg);
        },
      });
  }
}
