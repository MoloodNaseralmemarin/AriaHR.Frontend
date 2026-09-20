import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ShiftService } from '../../services/shift.service';
import { CreateShiftDto } from '../../models/create-shift.dto';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

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
  selector: 'app-create-shift',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ToastComponent],
  templateUrl: './create-shift.component.html',
  styleUrls: ['./create-shift.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateShiftComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly shiftService = inject(ShiftService);
  private readonly router = inject(Router);

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccessToast = signal(false);

  readonly isSubmitting = computed(() => this.submitState() === 'submitting');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    startTime: ['', [Validators.required, time24hValidator]],
    endTime: ['', [Validators.required, time24hValidator]],
    isActive: [true],
  });

  get f() {
    return this.form.controls;
  }

  normalizeTimeString(rawTime?: string): string {
    return normalizeTimeString(rawTime);
  }

  /** true when endTime is not strictly after startTime, once both are valid */
  timeRangeInvalid(): boolean {
    const start = normalizeTimeString(this.form.controls.startTime.value);
    const end = normalizeTimeString(this.form.controls.endTime.value);
    if (!start || !end) return false;
    if (!TIME_24H_REGEX.test(start) || !TIME_24H_REGEX.test(end)) return false;
    return end <= start;
  }

  isControlInvalid(name: 'name' | 'startTime' | 'endTime'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    // Normalize input times before validation check
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

    const value = this.form.getRawValue();
    const request: CreateShiftDto = {
      name: value.name.trim(),
      startTime: normalizedStart,
      endTime: normalizedEnd,
      isActive: value.isActive,
    };

    this.submitState.set('submitting');

    this.shiftService
      .createShift(request)
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
            err?.error?.message || 'ثبت شیفت با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
          );
        },
      });
  }
}
