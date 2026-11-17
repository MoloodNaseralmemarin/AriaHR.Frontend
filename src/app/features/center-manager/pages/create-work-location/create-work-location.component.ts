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
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { parseApiError } from '../../../../core/http/api-error.util';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { QrCodeModalComponent } from '../../../../shared/components/qr-code-modal/qr-code-modal.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import {
  WorkLocationMapComponent,
  WorkLocationPoint,
} from '../../components/work-location-map/work-location-map.component';
import { CreateWorkLocationDto } from '../../models/create-work-location.dto';
import { WorkLocationQrView } from '../../models/work-location-qr-view.model';
import { WorkLocationService } from '../../services/work-location.service';
import {
  WORK_LOCATION_DEFAULT_RADIUS_METERS,
  WORK_LOCATION_MAX_RADIUS_METERS,
  WORK_LOCATION_MIN_RADIUS_METERS,
  WORK_LOCATION_NAME_MAX_LENGTH,
} from '../../utils/work-location.constants';
import {
  resolveWorkLocationFieldErrors,
  resolveWorkLocationSubmitError,
  WorkLocationField,
  WorkLocationFieldErrors,
} from '../../utils/work-location-error.util';
import {
  coordinateMessage,
  nonWhitespaceValidator,
  workLocationNameMessage,
  workLocationRadiusMessage,
} from '../../utils/work-location-form.util';
import { normalizeQrMode } from '../../utils/work-location-qr.util';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-create-work-location',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    QrCodeModalComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    PersianDigitsPipe,
    WorkLocationMapComponent,
  ],
  templateUrl: './create-work-location.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWorkLocationComponent implements OnInit {
  @ViewChild(WorkLocationMapComponent) private mapComponent?: WorkLocationMapComponent;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly workLocationService = inject(WorkLocationService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
  /** Field-level messages from the backend `ProblemDetails.errors` payload. */
  readonly fieldErrors = signal<WorkLocationFieldErrors>({});
  readonly selectedLocation = signal<WorkLocationPoint | null>(null);

  readonly isSubmitting = computed(() => this.submitState() === 'submitting');
  readonly isSubmitted = computed(() => this.submitState() === 'success');

  readonly createdWorkLocationId = signal<string | null>(null);
  readonly isGeneratingQr = signal(false);
  readonly qrData = signal<WorkLocationQrView | null>(null);
  readonly showQrModal = signal(false);

  readonly minRadius = WORK_LOCATION_MIN_RADIUS_METERS;
  readonly maxRadius = WORK_LOCATION_MAX_RADIUS_METERS;
  readonly nameMaxLength = WORK_LOCATION_NAME_MAX_LENGTH;

  readonly form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.maxLength(this.nameMaxLength), nonWhitespaceValidator],
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

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
      if (Object.keys(this.fieldErrors()).length > 0) {
        this.fieldErrors.set({});
      }
      if (this.submitState() === 'error') {
        this.submitState.set('idle');
      }
    });
  }

  onLocationSelected(location: WorkLocationPoint): void {
    this.selectedLocation.set(location);
    this.errorMessage.set(null);
    this.fieldErrors.set({});
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

  /** Backend validation message for a field, if the last submission reported one. */
  fieldError(field: WorkLocationField): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  onSubmit(): void {
    // Guard against double clicks and duplicate records: a submission that is in
    // flight or already succeeded must not post again.
    if (this.isSubmitting() || this.isSubmitted()) {
      return;
    }

    this.errorMessage.set(null);
    this.fieldErrors.set({});

    const location = this.selectedLocation();
    if (!location) {
      this.errorMessage.set('لطفاً ابتدا محل مرکز را روی نقشه انتخاب کنید.');
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

    // The organization is derived from the authenticated manager's JWT on the
    // backend, so it is deliberately absent from the payload.
    const request: CreateWorkLocationDto = {
      name: value.name.trim(),
      latitude: location.lat,
      longitude: location.lng,
      allowedRadiusInMeters: Number(value.radiusInMeters),
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
        next: (response) => {
          this.submitState.set('success');
          const createdId = response?.id ?? null;
          if (createdId) {
            this.createdWorkLocationId.set(createdId);
          }
          this.notificationService.showSuccess('محل کار با موفقیت ثبت شد.');
          // The saved location is now the source of truth: return to the list.
          // Without an id the summary stays on screen instead of navigating.
          if (createdId) {
            void this.router.navigate(['/center-manager/work-locations']);
          }
        },
        error: (error) => {
          this.submitState.set('error');
          this.fieldErrors.set(resolveWorkLocationFieldErrors(error));
          this.errorMessage.set(resolveWorkLocationSubmitError(error, 'create'));
        },
      });
  }

  /** Clears the saved registration so another work location can be added. */
  startNewRegistration(): void {
    this.submitState.set('idle');
    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.createdWorkLocationId.set(null);
    this.qrData.set(null);
    this.showQrModal.set(false);
    this.selectedLocation.set(null);

    this.mapComponent?.reset();

    this.form.reset({
      name: '',
      radiusInMeters: WORK_LOCATION_DEFAULT_RADIUS_METERS,
      isActive: true,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onGenerateQrCode(): void {
    const workLocationId = this.createdWorkLocationId();
    if (!workLocationId || this.isGeneratingQr()) {
      return;
    }

    this.isGeneratingQr.set(true);
    this.errorMessage.set(null);

    this.workLocationService
      .generateQrCode(workLocationId)
      .pipe(finalize(() => this.isGeneratingQr.set(false)))
      .subscribe({
        next: (response) => {
          this.qrData.set({
            code: response.token,
            expiresAtUtc: response.expiresAtUtc ?? null,
            qrCodeMode: normalizeQrMode(response.qrCodeMode),
          });
          this.showQrModal.set(true);
        },
        error: (error) => this.errorMessage.set(parseApiError(error).message),
      });
  }
}
