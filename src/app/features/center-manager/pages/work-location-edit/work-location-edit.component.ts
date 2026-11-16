import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { distinctUntilChanged, finalize, map } from 'rxjs';

import { parseApiError } from '../../../../core/http/api-error.util';
import { NotificationService } from '../../../../core/services/notification.service';
import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { QrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  WorkLocationMapComponent,
  WorkLocationPoint,
} from '../../components/work-location-map/work-location-map.component';
import { QrCodeMode, QrCodeSettingsDto } from '../../models/qr-code-settings.dto';
import { UpdateWorkLocationDto } from '../../models/update-work-location.dto';
import { WorkLocationQrView } from '../../models/work-location-qr-view.model';
import { WorkLocationResponseDto } from '../../models/work-location-response.dto';
import { WorkLocationService } from '../../services/work-location.service';
import {
  WORK_LOCATION_DEFAULT_RADIUS_METERS,
  WORK_LOCATION_MAX_RADIUS_METERS,
  WORK_LOCATION_MIN_RADIUS_METERS,
  WORK_LOCATION_NAME_MAX_LENGTH,
} from '../../utils/work-location.constants';
import { resolveWorkLocationSubmitError } from '../../utils/work-location-error.util';
import {
  coordinateMessage,
  nonWhitespaceValidator,
  workLocationNameMessage,
  workLocationRadiusMessage,
} from '../../utils/work-location-form.util';
import { normalizeQrMode, qrModeDescription } from '../../utils/work-location-qr.util';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-work-location-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DeleteConfirmationComponent,
    EmptyStateComponent,
    JalaliPipe,
    PersianDigitsPipe,
    PageHeaderComponent,
    QrCodeModalComponent,
    SkeletonLoaderComponent,
    StatusBadgeComponent,
    WorkLocationMapComponent,
  ],
  templateUrl: './work-location-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterManagerWorkLocationEditComponent implements OnInit {
  @ViewChild(WorkLocationMapComponent) private mapComponent?: WorkLocationMapComponent;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly workLocationService = inject(WorkLocationService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly selectedLocation = signal<WorkLocationPoint | null>(null);

  readonly isLoadingLocation = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly workLocation = signal<WorkLocationResponseDto | null>(null);
  readonly workLocationId = signal<string | null>(null);

  readonly submitSuccess = computed(() => this.submitState() === 'success');
  readonly isSubmitting = computed(() => this.submitState() === 'submitting');

  readonly qrSettings = signal<QrCodeSettingsDto | null>(null);
  readonly isLoadingQrSettings = signal(false);
  readonly qrSettingsError = signal<string | null>(null);
  readonly qrActionError = signal<string | null>(null);
  readonly isSavingQrSettings = signal(false);
  readonly isTogglingQrEnabled = signal(false);
  readonly isGeneratingQr = signal(false);
  readonly isLoadingCurrentQr = signal(false);
  readonly qrData = signal<WorkLocationQrView | null>(null);
  readonly showQrModal = signal(false);
  readonly qrDisableConfirmOpen = signal(false);
  readonly qrGenerateConfirmOpen = signal(false);

  readonly minRadius = WORK_LOCATION_MIN_RADIUS_METERS;
  readonly maxRadius = WORK_LOCATION_MAX_RADIUS_METERS;
  readonly nameMaxLength = WORK_LOCATION_NAME_MAX_LENGTH;

  readonly form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.maxLength(WORK_LOCATION_NAME_MAX_LENGTH), nonWhitespaceValidator],
    ],
    radiusInMeters: [
      WORK_LOCATION_DEFAULT_RADIUS_METERS,
      [
        Validators.required,
        Validators.min(WORK_LOCATION_MIN_RADIUS_METERS),
        Validators.max(WORK_LOCATION_MAX_RADIUS_METERS),
      ],
    ],
    isActive: [true],
  });

  readonly qrForm = this.fb.group({
    qrCodeMode: this.fb.control<QrCodeMode>('Static'),
    qrRotationIntervalMinutes: this.fb.control(5),
  });

  get minRotationInterval(): number {
    return this.qrSettings()?.minRotationIntervalMinutes ?? 1;
  }

  get maxRotationInterval(): number {
    return this.qrSettings()?.maxRotationIntervalMinutes ?? 1440;
  }

  ngOnInit(): void {
    this.qrForm.controls.qrRotationIntervalMinutes.disable({ emitEvent: false });

    this.qrForm.controls.qrCodeMode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => {
        const interval = this.qrForm.controls.qrRotationIntervalMinutes;
        if (mode === 'Dynamic') {
          interval.enable({ emitEvent: false });
        } else {
          interval.disable({ emitEvent: false });
        }
      });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
      if (this.submitState() === 'success' || this.submitState() === 'error') {
        this.submitState.set('idle');
      }
    });

    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        if (!id) {
          this.workLocationId.set(null);
          this.loadError.set('شناسهٔ محل کار معتبر نیست.');
          this.isLoadingLocation.set(false);
          return;
        }

        this.workLocationId.set(id);
        this.resetState();
        this.loadWorkLocation(id);
      });
  }

  onLocationSelected(location: WorkLocationPoint): void {
    this.selectedLocation.set(location);
    this.form.markAsDirty();
    this.errorMessage.set(null);
  }

  isControlInvalid(name: 'name' | 'radiusInMeters'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  nameMessage(): string | null {
    return workLocationNameMessage(this.form.controls.name);
  }

  radiusMessage(): string | null {
    return workLocationRadiusMessage(this.form.controls.radiusInMeters);
  }

  qrIntervalMessage(): string | null {
    const control = this.qrForm.controls.qrRotationIntervalMinutes;
    if (control.hasError('required')) {
      return 'وارد کردن بازهٔ چرخش کد الزامی است.';
    }
    if (control.hasError('min')) {
      return `بازهٔ چرخش کد نمی‌تواند کمتر از ${this.minRotationInterval.toLocaleString(
        'fa-IR'
      )} دقیقه باشد.`;
    }
    if (control.hasError('max')) {
      return `بازهٔ چرخش کد نمی‌تواند بیشتر از ${this.maxRotationInterval.toLocaleString(
        'fa-IR'
      )} دقیقه باشد.`;
    }
    return null;
  }

  isQrControlInvalid(): boolean {
    const control = this.qrForm.controls.qrRotationIntervalMinutes;
    return control.invalid && (control.touched || control.dirty);
  }

  qrModeHelp(): string {
    return qrModeDescription(this.qrForm.controls.qrCodeMode.value);
  }

  retryLoad(): void {
    const id = this.workLocationId();
    if (id) {
      this.resetState();
      this.loadWorkLocation(id);
    }
  }

  retryQrSettings(): void {
    const id = this.workLocationId();
    if (id) {
      this.loadQrSettings(id);
    }
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }

    const id = this.workLocationId();
    if (!id) {
      this.errorMessage.set('شناسهٔ محل کار معتبر نیست.');
      return;
    }

    const location = this.selectedLocation();
    if (!location) {
      this.errorMessage.set('لطفاً محل مرکز را روی نقشه انتخاب کنید.');
      this.form.markAllAsTouched();
      return;
    }

    const coordinatesError = coordinateMessage(location.lat, location.lng);
    if (coordinatesError) {
      this.errorMessage.set(coordinatesError);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: UpdateWorkLocationDto = {
      name: value.name.trim(),
      latitude: location.lat,
      longitude: location.lng,
      allowedRadiusInMeters: Number(value.radiusInMeters),
      isActive: value.isActive,
    };

    this.errorMessage.set(null);
    this.submitState.set('submitting');

    this.workLocationService
      .updateWorkLocation(id, request)
      .pipe(
        finalize(() => {
          if (this.submitState() === 'submitting') {
            this.submitState.set('idle');
          }
        })
      )
      .subscribe({
        next: (response) => {
          this.workLocation.set(response);
          this.submitState.set('success');
          this.notificationService.showSuccess('تغییرات محل کار با موفقیت ذخیره شد.');
        },
        error: (error) => {
          this.submitState.set('error');
          this.errorMessage.set(resolveWorkLocationSubmitError(error, 'update'));
        },
      });
  }

  saveQrSettings(): void {
    const id = this.workLocationId();
    if (!id || this.isSavingQrSettings()) {
      return;
    }

    if (this.qrForm.invalid) {
      this.qrForm.markAllAsTouched();
      return;
    }

    const value = this.qrForm.getRawValue();
    const mode = normalizeQrMode(value.qrCodeMode);
    const interval = Number(value.qrRotationIntervalMinutes);

    this.qrActionError.set(null);
    this.isSavingQrSettings.set(true);

    this.workLocationService
      .updateQrCodeSettings(id, {
        qrCodeMode: mode,
        qrRotationIntervalMinutes: mode === 'Dynamic' ? interval : null,
      })
      .pipe(finalize(() => this.isSavingQrSettings.set(false)))
      .subscribe({
        next: (settings) => {
          this.applyQrSettings(settings);
          this.notificationService.showSuccess('تنظیمات کد QR ذخیره شد.');
        },
        error: (error) => {
          this.qrActionError.set(parseApiError(error).message);
        },
      });
  }

  requestToggleQrEnabled(): void {
    const settings = this.qrSettings();
    const id = this.workLocationId();
    if (!settings || !id || this.isTogglingQrEnabled()) {
      return;
    }

    if (settings.qrCodeEnabled) {
      this.qrDisableConfirmOpen.set(true);
      return;
    }

    this.setQrEnabled(id, true);
  }

  confirmDisableQr(): void {
    const id = this.workLocationId();
    if (!id) {
      return;
    }
    this.setQrEnabled(id, false);
  }

  cancelDisableQr(): void {
    if (!this.isTogglingQrEnabled()) {
      this.qrDisableConfirmOpen.set(false);
    }
  }

  viewCurrentQr(): void {
    const id = this.workLocationId();
    const settings = this.qrSettings();
    if (!id || !settings?.qrCodeEnabled || this.isLoadingCurrentQr()) {
      return;
    }

    this.qrActionError.set(null);
    this.isLoadingCurrentQr.set(true);

    this.workLocationService
      .getCurrentQrCode(id)
      .pipe(finalize(() => this.isLoadingCurrentQr.set(false)))
      .subscribe({
        next: (response) => this.openQrModal(response.token, response.expiresAtUtc, response.qrCodeMode),
        error: (error) => {
          const info = parseApiError(error);
          this.qrActionError.set(
            info.status === 404
              ? 'کد QR فعلی در دسترس نیست. می‌توانید یک کد جدید صادر کنید.'
              : info.message
          );
        },
      });
  }

  /** Asking for a new token invalidates the current one, so confirm first. */
  requestGenerateNewQr(): void {
    const settings = this.qrSettings();
    if (!settings?.qrCodeEnabled || this.isGeneratingQr()) {
      return;
    }

    this.qrGenerateConfirmOpen.set(true);
  }

  confirmGenerateNewQr(): void {
    this.generateNewQr();
  }

  cancelGenerateNewQr(): void {
    if (!this.isGeneratingQr()) {
      this.qrGenerateConfirmOpen.set(false);
    }
  }

  private generateNewQr(): void {
    const id = this.workLocationId();
    const settings = this.qrSettings();
    if (!id || !settings?.qrCodeEnabled || this.isGeneratingQr()) {
      return;
    }

    this.qrActionError.set(null);
    this.isGeneratingQr.set(true);

    this.workLocationService
      .generateQrCode(id)
      .pipe(finalize(() => this.isGeneratingQr.set(false)))
      .subscribe({
        next: (response) => {
          this.qrGenerateConfirmOpen.set(false);
          this.openQrModal(response.token, response.expiresAtUtc, response.qrCodeMode);
        },
        error: (error) => {
          this.qrGenerateConfirmOpen.set(false);
          this.qrActionError.set(parseApiError(error).message);
        },
      });
  }

  private openQrModal(
    code: string,
    expiresAtUtc: string | null | undefined,
    mode: string | null | undefined
  ): void {
    this.qrData.set({
      code,
      expiresAtUtc: expiresAtUtc ?? null,
      qrCodeMode: normalizeQrMode(mode),
    });
    this.showQrModal.set(true);
  }

  private setQrEnabled(id: string, enabled: boolean): void {
    this.qrActionError.set(null);
    this.isTogglingQrEnabled.set(true);

    const request$ = enabled
      ? this.workLocationService.enableQrCode(id)
      : this.workLocationService.disableQrCode(id);

    request$.pipe(finalize(() => this.isTogglingQrEnabled.set(false))).subscribe({
      next: (settings) => {
        this.applyQrSettings(settings);
        this.qrDisableConfirmOpen.set(false);
        this.notificationService.showSuccess(
          enabled ? 'کد QR فعال شد.' : 'کد QR غیرفعال شد.'
        );
      },
      error: (error) => {
        this.qrActionError.set(parseApiError(error).message);
        this.qrDisableConfirmOpen.set(false);
      },
    });
  }

  private loadWorkLocation(id: string): void {
    this.isLoadingLocation.set(true);
    this.loadError.set(null);

    this.workLocationService
      .getWorkLocationById(id)
      .pipe(finalize(() => this.isLoadingLocation.set(false)))
      .subscribe({
        next: (response) => {
          this.workLocation.set(response);
          this.selectedLocation.set({
            lat: Number(response.latitude),
            lng: Number(response.longitude),
          });
          this.form.patchValue(
            {
              name: response.name,
              radiusInMeters: Number(response.allowedRadiusInMeters),
              isActive: response.isActive,
            },
            { emitEvent: false }
          );
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.loadQrSettings(id);
        },
        error: (error) => {
          const info = parseApiError(error);
          this.loadError.set(
            info.status === 404
              ? 'محل کار مورد نظر یافت نشد. ممکن است حذف شده باشد.'
              : info.message
          );
        },
      });
  }

  private loadQrSettings(id: string): void {
    this.isLoadingQrSettings.set(true);
    this.qrSettingsError.set(null);

    this.workLocationService
      .getQrCodeSettings(id)
      .pipe(finalize(() => this.isLoadingQrSettings.set(false)))
      .subscribe({
        next: (settings) => this.applyQrSettings(settings),
        error: (error) => {
          this.qrSettingsError.set(parseApiError(error).message);
        },
      });
  }

  private applyQrSettings(settings: QrCodeSettingsDto): void {
    const mode = normalizeQrMode(settings.qrCodeMode);
    this.qrSettings.set({ ...settings, qrCodeMode: mode });

    const interval = this.qrForm.controls.qrRotationIntervalMinutes;
    interval.setValidators([
      Validators.required,
      Validators.min(settings.minRotationIntervalMinutes),
      Validators.max(settings.maxRotationIntervalMinutes),
    ]);

    this.qrForm.patchValue(
      {
        qrCodeMode: mode,
        qrRotationIntervalMinutes:
          settings.rotationIntervalMinutes ?? settings.defaultRotationIntervalMinutes ?? 5,
      },
      { emitEvent: false }
    );

    if (mode === 'Dynamic') {
      interval.enable({ emitEvent: false });
    } else {
      interval.disable({ emitEvent: false });
    }

    interval.updateValueAndValidity({ emitEvent: false });
    this.qrForm.markAsPristine();
    this.qrForm.markAsUntouched();
    this.qrActionError.set(null);
  }

  private resetState(): void {
    this.submitState.set('idle');
    this.errorMessage.set(null);
    this.loadError.set(null);
    this.selectedLocation.set(null);
    this.workLocation.set(null);
    this.qrSettings.set(null);
    this.qrSettingsError.set(null);
    this.qrActionError.set(null);
    this.qrDisableConfirmOpen.set(false);
    this.qrGenerateConfirmOpen.set(false);
    this.showQrModal.set(false);
    this.qrData.set(null);

    this.form.reset(
      {
        name: '',
        radiusInMeters: WORK_LOCATION_DEFAULT_RADIUS_METERS,
        isActive: true,
      },
      { emitEvent: false }
    );
    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.qrForm.controls.qrCodeMode.setValue('Static', { emitEvent: false });
    this.qrForm.controls.qrRotationIntervalMinutes.setValue(5, { emitEvent: false });
    this.qrForm.controls.qrRotationIntervalMinutes.disable({ emitEvent: false });
    this.qrForm.markAsPristine();
    this.qrForm.markAsUntouched();

    this.mapComponent?.reset();
  }
}
