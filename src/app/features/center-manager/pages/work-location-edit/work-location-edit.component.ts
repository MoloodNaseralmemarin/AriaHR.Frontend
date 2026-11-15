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
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { QrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { environment } from '../../../../../environments/environment';
import { extractApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  MAX_ROTATION_INTERVAL_MINUTES,
  MIN_ROTATION_INTERVAL_MINUTES,
  QR_CODE_MODE_LABELS,
  QrCodeMode,
} from '../../models/create-work-location.dto';
import { QrCodeSettingsDto } from '../../models/qr-code-response.dto';
import { UpdateWorkLocationDto } from '../../models/update-work-location.dto';
import { WorkLocationService } from '../../services/work-location.service';

/** Default viewport: Hamedan city, Hamedan Province, Iran. */
const HAMEDAN_CENTER: [number, number] = [34.7983, 48.5147];
const HAMEDAN_DEFAULT_ZOOM = 13;
/** Close enough to distinguish streets once the user's own position is known. */
const CURRENT_LOCATION_ZOOM = 16;
const GEOLOCATION_TIMEOUT_MS = 15000;

/**
 * Backend validation bounds. The server rejects values outside the WGS-84 range
 * and outside `QrCodeOptions` (radius 1..1000 m), so the form mirrors them to
 * fail fast with a Persian message instead of a 400.
 */
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const MIN_RADIUS_METERS = 1;
const MAX_RADIUS_METERS = 1000;
const DEFAULT_RADIUS_METERS = 200;
const MAX_NAME_LENGTH = 150;

const ASSET_LOAD_TIMEOUT_MS = 20000;

declare const L: any;

@Component({
  selector: 'app-work-location-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ToastComponent, QrCodeModalComponent],
  templateUrl: './work-location-edit.component.html',
  styleUrls: ['./work-location-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterManagerWorkLocationEditComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly workLocationService = inject(WorkLocationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly workLocationId = signal<string | null>(null);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessToast = signal(false);
  readonly isSaving = signal(false);

  readonly isMapLoading = signal(true);
  readonly mapError = signal<string | null>(null);
  readonly isResolvingAddress = signal(false);
  readonly resolvedAddress = signal<string | null>(null);

  readonly isLocatingCurrentPosition = signal(false);
  readonly locationError = signal<string | null>(null);

  readonly selectedLocation = signal<{ lat: number; lng: number } | null>(null);

  readonly qrSettings = signal<QrCodeSettingsDto | null>(null);
  readonly qrSettingsError = signal<string | null>(null);
  readonly isQrBusy = signal(false);
  readonly qrData = signal<{ token: string; expiresAtUtc: string | null } | null>(null);
  readonly showQrModal = signal(false);

  readonly isSubmitted = computed(() => this.showSuccessToast());

  readonly minRadius = MIN_RADIUS_METERS;
  readonly maxRadius = MAX_RADIUS_METERS;
  readonly maxNameLength = MAX_NAME_LENGTH;
  readonly minRotation = MIN_ROTATION_INTERVAL_MINUTES;
  readonly maxRotation = MAX_ROTATION_INTERVAL_MINUTES;
  readonly qrCodeModes = [QrCodeMode.Static, QrCodeMode.Dynamic];
  readonly qrCodeModeLabels = QR_CODE_MODE_LABELS;
  readonly qrModeStatic = QrCodeMode.Static;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(MAX_NAME_LENGTH)]],
    radiusInMeters: [
      DEFAULT_RADIUS_METERS,
      [Validators.required, Validators.min(MIN_RADIUS_METERS), Validators.max(MAX_RADIUS_METERS)],
    ],
    isActive: [true],
    qrCodeMode: [QrCodeMode.Static],
    qrRotationIntervalMinutes: [
      MIN_ROTATION_INTERVAL_MINUTES,
      [
        Validators.required,
        Validators.min(MIN_ROTATION_INTERVAL_MINUTES),
        Validators.max(MAX_ROTATION_INTERVAL_MINUTES),
      ],
    ],
  });

  private mapInstance: any = null;
  private markerInstance: any = null;
  private circleInstance: any = null;
  /** Detected device position — deliberately separate from the draggable selection marker. */
  private currentPositionMarker: any = null;
  private accuracyCircle: any = null;
  private mapReady = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isLoading.set(false);
      this.loadError.set('شناسهٔ محل کار در آدرس صفحه مشخص نشده است.');
      return;
    }
    this.workLocationId.set(id);

    this.form.controls.radiusInMeters.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.updateRadiusCircle(val));

    this.loadWorkLocation(id);
    this.loadQrSettings(id);
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

  private loadWorkLocation(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.workLocationService
      .getWorkLocationById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (location) => {
          if (!location) {
            this.loadError.set('محل کار درخواستی یافت نشد.');
            return;
          }

          this.form.patchValue({
            name: location.name ?? '',
            radiusInMeters: location.allowedRadiusInMeters,
            isActive: location.isActive,
          });
          this.form.markAsPristine();

          this.selectLocation(location.latitude, location.longitude);
          if (this.mapReady) {
            this.focusMapOn(location.latitude, location.longitude, CURRENT_LOCATION_ZOOM);
          }
        },
        error: (err) => {
          this.loadError.set(
            extractApiErrorMessage(err, 'دریافت اطلاعات محل کار با خطا مواجه شد.')
          );
        },
      });
  }

  private loadQrSettings(id: string): void {
    this.qrSettingsError.set(null);
    this.workLocationService.getQrCodeSettings(id).subscribe({
      next: (settings) => this.applyQrSettings(settings),
      error: (err) => {
        this.qrSettingsError.set(
          extractApiErrorMessage(err, 'دریافت تنظیمات QR Code با خطا مواجه شد.')
        );
      },
    });
  }

  private applyQrSettings(settings: QrCodeSettingsDto): void {
    this.qrSettings.set(settings);
    this.form.patchValue({
      qrCodeMode: settings.qrCodeMode === 'Dynamic' ? QrCodeMode.Dynamic : QrCodeMode.Static,
      qrRotationIntervalMinutes: settings.rotationIntervalMinutes,
    });
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

        if (typeof this.mapInstance.invalidateSize === 'function') {
          setTimeout(() => this.mapInstance?.invalidateSize?.(), 0);
        }

        this.isMapLoading.set(false);
        this.mapReady = true;

        // The record may have been loaded before the SDK finished loading.
        const loc = this.selectedLocation();
        if (loc) {
          this.selectLocation(loc.lat, loc.lng);
          this.focusMapOn(loc.lat, loc.lng, CURRENT_LOCATION_ZOOM);
        }
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
        link.href =
          'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css';
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
      script.src =
        'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js';
      script.addEventListener('load', () => {
        script.setAttribute('data-neshan-loaded', 'true');
        settleResolve();
      });
      script.addEventListener('error', settleReject);
      document.head.appendChild(script);
    });
  }

  useCurrentLocation(): void {
    if (this.isLocatingCurrentPosition()) {
      return;
    }

    this.locationError.set(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationError.set('مرورگر شما از قابلیت موقعیت مکانی پشتیبانی نمی‌کند.');
      return;
    }

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
          this.resolvedAddress.set(addr ?? 'تبدیل موقعیت به آدرس انجام نشد');
        },
        error: () => {
          this.resolvedAddress.set('تبدیل موقعیت به آدرس انجام نشد');
        },
      });
  }

  isControlInvalid(name: 'name' | 'radiusInMeters' | 'qrRotationIntervalMinutes'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  nameMessage(): string | null {
    const control = this.form.controls.name;
    if (control.hasError('required')) {
      return 'وارد کردن نام محل کار الزامی است.';
    }
    if (control.hasError('maxlength')) {
      return `نام محل کار نمی‌تواند بیشتر از ${MAX_NAME_LENGTH} کاراکتر باشد.`;
    }
    return null;
  }

  radiusMessage(): string | null {
    const control = this.form.controls.radiusInMeters;
    if (control.hasError('required')) {
      return 'وارد کردن شعاع محدودهٔ مجاز الزامی است.';
    }
    if (control.hasError('min')) {
      return 'شعاع محدوده باید حداقل ۱ متر باشد.';
    }
    if (control.hasError('max')) {
      return `شعاع محدوده نمی‌تواند بیشتر از ${MAX_RADIUS_METERS.toLocaleString('fa-IR')} متر باشد.`;
    }
    return null;
  }

  rotationMessage(): string | null {
    const control = this.form.controls.qrRotationIntervalMinutes;
    if (control.hasError('min')) {
      return `بازهٔ چرخش QR باید حداقل ${MIN_ROTATION_INTERVAL_MINUTES} دقیقه باشد.`;
    }
    if (control.hasError('max')) {
      return `بازهٔ چرخش QR نمی‌تواند بیشتر از ${MAX_ROTATION_INTERVAL_MINUTES} دقیقه باشد.`;
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
    const id = this.workLocationId();
    if (!id || this.isSaving()) {
      return;
    }

    this.errorMessage.set(null);
    this.showSuccessToast.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loc = this.selectedLocation();
    if (!loc) {
      this.errorMessage.set('لطفاً ابتدا محل کار را روی نقشه انتخاب کنید.');
      return;
    }

    const coordinatesError = this.coordinateError(loc.lat, loc.lng);
    if (coordinatesError) {
      this.errorMessage.set(coordinatesError);
      return;
    }

    const value = this.form.getRawValue();
    const request: UpdateWorkLocationDto = {
      name: value.name.trim(),
      latitude: loc.lat,
      longitude: loc.lng,
      allowedRadiusInMeters: value.radiusInMeters,
      isActive: value.isActive,
    };

    this.isSaving.set(true);
    this.workLocationService
      .updateWorkLocation(id, request)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.showSuccessToast.set(true);
        },
        error: (err) => {
          this.errorMessage.set(
            extractApiErrorMessage(err, 'ویرایش محل کار با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
          );
        },
      });
  }

  saveQrSettings(): void {
    const id = this.workLocationId();
    if (!id || this.isQrBusy()) {
      return;
    }

    if (this.form.controls.qrRotationIntervalMinutes.invalid) {
      this.form.controls.qrRotationIntervalMinutes.markAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.qrSettingsError.set(null);
    this.isQrBusy.set(true);

    this.workLocationService
      .updateQrCodeSettings(id, {
        qrCodeMode: value.qrCodeMode,
        qrRotationIntervalMinutes: value.qrRotationIntervalMinutes,
      })
      .pipe(finalize(() => this.isQrBusy.set(false)))
      .subscribe({
        next: (settings) => {
          this.applyQrSettings(settings);
          this.qrData.set(null);
        },
        error: (err) => {
          this.qrSettingsError.set(
            extractApiErrorMessage(err, 'ذخیرهٔ تنظیمات QR Code با خطا مواجه شد.')
          );
        },
      });
  }

  toggleQrCode(): void {
    const id = this.workLocationId();
    const settings = this.qrSettings();
    if (!id || !settings || this.isQrBusy()) {
      return;
    }

    this.qrSettingsError.set(null);
    this.isQrBusy.set(true);

    const request$ = settings.qrCodeEnabled
      ? this.workLocationService.disableQrCode(id)
      : this.workLocationService.enableQrCode(id);

    request$.pipe(finalize(() => this.isQrBusy.set(false))).subscribe({
      next: (updated) => {
        this.applyQrSettings(updated);
        if (!updated.qrCodeEnabled) {
          this.qrData.set(null);
        }
      },
      error: (err) => {
        this.qrSettingsError.set(
          extractApiErrorMessage(err, 'تغییر وضعیت QR Code با خطا مواجه شد.')
        );
      },
    });
  }

  onGenerateQrCode(): void {
    const id = this.workLocationId();
    if (!id || this.isQrBusy()) {
      return;
    }

    this.qrSettingsError.set(null);
    this.isQrBusy.set(true);

    this.workLocationService
      .generateQrCode(id)
      .pipe(finalize(() => this.isQrBusy.set(false)))
      .subscribe({
        next: (res) => {
          this.qrData.set({ token: res.token, expiresAtUtc: res.expiresAtUtc });
          this.showQrModal.set(true);
        },
        error: (err) => {
          this.qrSettingsError.set(
            extractApiErrorMessage(err, 'خطا در دریافت QR کد محل کار.')
          );
        },
      });
  }

  onRevokeQrCode(): void {
    const id = this.workLocationId();
    if (!id || this.isQrBusy()) {
      return;
    }

    this.qrSettingsError.set(null);
    this.isQrBusy.set(true);

    this.workLocationService
      .revokeQrCode(id)
      .pipe(finalize(() => this.isQrBusy.set(false)))
      .subscribe({
        next: () => {
          this.qrData.set(null);
          this.showQrModal.set(false);
        },
        error: (err) => {
          this.qrSettingsError.set(
            extractApiErrorMessage(err, 'ابطال QR Code با خطا مواجه شد.')
          );
        },
      });
  }
}

export { CenterManagerWorkLocationEditComponent as WorkLocationEditComponent };
