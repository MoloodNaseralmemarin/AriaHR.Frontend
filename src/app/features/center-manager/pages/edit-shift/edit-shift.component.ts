import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ShiftService } from '../../services/shift.service';
import { UpdateShiftDto } from '../../models/update-shift.dto';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const TIME_24H_REGEX = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

export function normalizeTimeString(rawTime?: string): string {
  if (!rawTime) return '';
  let latinDigits = rawTime
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim();

  const parts = latinDigits.split(':');
  if (parts.length === 2 && parts[0] !== '' && parts[1] !== '') {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    latinDigits = `${hours}:${minutes}`;
  }
  return latinDigits;
}

export function time24hValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const normalized = normalizeTimeString(control.value);
  if (TIME_24H_REGEX.test(normalized)) {
    return null;
  }
  return { pattern: true };
}

@Component({
  selector: 'app-edit-shift',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ToastComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './edit-shift.component.html',
  styleUrls: ['./edit-shift.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditShiftComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly shiftService = inject(ShiftService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly shiftId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly showSuccessToast = signal(false);

  readonly isSubmitting = computed(() => this.submitState() === 'submitting');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    startTime: ['', [Validators.required, time24hValidator]],
    endTime: ['', [Validators.required, time24hValidator]],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError.set('شناسه شیفت نامعتبر است.');
      this.isLoading.set(false);
      return;
    }

    this.shiftId.set(id);
    this.loadShift(id);
  }

  loadShift(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.shiftService.getShiftById(id).subscribe({
      next: (shift) => {
        if (shift) {
          this.form.patchValue({
            name: shift.name,
            startTime: normalizeTimeString(shift.startTime),
            endTime: normalizeTimeString(shift.endTime),
            isActive: shift.isActive,
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loadError.set(
          err?.error?.message || 'دریافت اطلاعات شیفت با خطا مواجه شد.'
        );
      },
    });
  }

  get f() {
    return this.form.controls;
  }

  timeRangeInvalid(): boolean {
    const start = normalizeTimeString(this.form.controls.startTime.value);
    const end = normalizeTimeString(this.form.controls.endTime.value);
    if (!start || !end) return false;
    if (!TIME_24H_REGEX.test(start) || !TIME_24H_REGEX.test(end)) return false;
    return start === end;
  }

  isControlInvalid(name: 'name' | 'startTime' | 'endTime'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    const rawStart = this.form.controls.startTime.value;
    const rawEnd = this.form.controls.endTime.value;
    const normalizedStart = normalizeTimeString(rawStart);
    const normalizedEnd = normalizeTimeString(rawEnd);

    if (normalizedStart !== rawStart) {
      this.form.controls.startTime.setValue(normalizedStart);
    }
    if (normalizedEnd !== rawEnd) {
      this.form.controls.endTime.setValue(normalizedEnd);
    }

    if (this.form.invalid || this.timeRangeInvalid()) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.shiftId();
    if (!id) {
      this.errorMessage.set('شناسه شیفت یافت نشد.');
      return;
    }

    const value = this.form.getRawValue();
    const request: UpdateShiftDto = {
      name: value.name.trim(),
      startTime: normalizedStart,
      endTime: normalizedEnd,
      isActive: value.isActive,
    };

    this.submitState.set('submitting');

    this.shiftService
      .updateShift(id, request)
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
          this.router.navigate(['/center-manager/shifts']);
        },
        error: (err) => {
          this.submitState.set('error');
          this.errorMessage.set(
            err?.error?.message || 'ویرایش شیفت با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
          );
        },
      });
  }
}
