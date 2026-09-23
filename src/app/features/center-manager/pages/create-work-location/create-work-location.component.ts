import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { environment } from '../../../../../environments/environment';
import { CreateWorkLocationDto } from '../../models/create-work-location.dto';
import { WorkLocationService } from '../../services/work-location.service';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

declare const L: any;

@Component({
  selector: 'app-create-work-location',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ToastComponent],
  templateUrl: './create-work-location.component.html',
  styleUrls: ['./create-work-location.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWorkLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly workLocationService = inject(WorkLocationService);
  private readonly authService = inject(AuthService);

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessToast = signal(false);

  readonly isMapLoading = signal(true);
  readonly mapError = signal<string | null>(null);
  readonly isResolvingAddress = signal(false);
  readonly resolvedAddress = signal<string | null>(null);

  readonly selectedLocation = signal<{ lat: number; lng: number } | null>(null);

  readonly isSubmitting = computed(() => this.submitState() === 'submitting');

  readonly form = this.fb.group({
    radiusInMeters: [200, [Validators.required, Validators.min(1)]],
    isActive: [true],
  });

  private mapInstance: any = null;
  private markerInstance: any = null;
  private circleInstance: any = null;

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.authService.getCurrentUser().subscribe({
        error: () => {},
      });
    }

    this.form.controls.radiusInMeters.valueChanges.subscribe((val) => {
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

  private initMap(): void {
    this.isMapLoading.set(true);
    this.mapError.set(null);

    const apiKey = environment.neshanApiKey;
    if (!apiKey) {
      this.mapError.set(
        'کلید API نقشه نشان تنظیم نشده است. لطفاً کلید neshanApiKey را در فایل تنظیمات پروژه وارد کنید.'
      );
      this.isMapLoading.set(false);
    }

    this.loadNeshanLeafletAssets()
      .then(() => {
        if (!this.mapContainer || !this.mapContainer.nativeElement) return;

        // Default viewport center: Tehran
        const tehranCenter = [35.6997, 51.338];

        this.mapInstance = L.map(this.mapContainer.nativeElement, {
          key: apiKey || 'web.leaflet.sdk',
          maptype: 'neshan',
          poi: true,
          traffic: false,
          center: tehranCenter,
          zoom: 14,
        });

        // Add standard tile layer fallback if L.map neshan plugin style is standard leaflet
        L.tileLayer('https://raster.neshan.org/v2/Standard/current/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://neshan.org">Neshan</a>',
        }).addTo(this.mapInstance);

        this.mapInstance.on('click', (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6));
          const lng = parseFloat(e.latlng.lng.toFixed(6));
          this.selectLocation(lat, lng);
        });

        this.isMapLoading.set(false);
      })
      .catch((err) => {
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

      const cssId = 'neshan-leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.css';
        document.head.appendChild(link);
      }

      const jsId = 'neshan-leaflet-js';
      if (document.getElementById(jsId)) {
        const existingScript = document.getElementById(jsId) as HTMLScriptElement;
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.js';
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
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

    // Trigger reverse geocoding
    this.resolveAddress(lat, lng);
  }

  private updateRadiusCircle(radius: number): void {
    const loc = this.selectedLocation();
    if (!loc || !this.mapInstance || !radius || radius <= 0) {
      if (this.circleInstance) {
        this.mapInstance.removeLayer(this.circleInstance);
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

    this.workLocationService
      .reverseGeocode(lat, lng)
      .pipe(finalize(() => this.isResolvingAddress.set(false)))
      .subscribe({
        next: (addr) => {
          if (addr) {
            this.resolvedAddress.set(addr);
          } else {
            this.resolvedAddress.set('آدرس یافت نشد یا کلید API نشان معتبر نیست.');
          }
        },
        error: () => {
          this.resolvedAddress.set('خطا در دریافت آدرس.');
        },
      });
  }

  isControlInvalid(name: 'radiusInMeters'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
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

    const userDetails = this.authService.userDetails();
    const orgId = userDetails?.organizationId;

    if (!orgId) {
      this.errorMessage.set('شما به هیچ مرکزی متصل نیستید و امکان ثبت محل کار را ندارید.');
      return;
    }

    const value = this.form.getRawValue();
    const request: CreateWorkLocationDto = {
      organizationId: orgId,
      latitude: loc.lat,
      longitude: loc.lng,
      radiusInMeters: value.radiusInMeters,
      isActive: value.isActive,
    };

    this.submitState.set('submitting');

    this.workLocationService
      .createWorkLocation(request)
      .pipe(
        finalize(() => {
          if (this.submitState() === 'submitting') {
            this.submitState.set('idle');
          }
        })
      )
      .subscribe({
        next: () => {
          this.submitState.set('success');
          this.showSuccessToast.set(true);
        },
        error: (err) => {
          this.submitState.set('error');
          this.errorMessage.set(
            err?.error?.message || 'ثبت محل کار با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
          );
        },
      });
  }
}
