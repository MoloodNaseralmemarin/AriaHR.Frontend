import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ShiftService } from '../../services/shift.service';
import { CreateShiftDto } from '../../models/create-shift.dto';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-create-shift',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './create-shift.component.html',
  styleUrls: ['./create-shift.component.css'],
})
export class CreateShiftComponent {
  private readonly fb = inject(FormBuilder);
  private readonly shiftService = inject(ShiftService);

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly isSubmitting = computed(() => this.submitState() === 'submitting');
  readonly isSuccess = computed(() => this.submitState() === 'success');

  readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    shiftDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    notes: [''],
  });

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  get f() {
    return this.form.controls;
  }

  /** true when endTime is not strictly after startTime, once both are set */
  readonly timeRangeInvalid = computed(() => {
    const values = this.formValues();
    const start = values.startTime;
    const end = values.endTime;
    if (!start || !end) return false;
    return end <= start;
  });

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid || this.timeRangeInvalid()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: CreateShiftDto = {
      employeeId: value.employeeId,
      shiftDate: value.shiftDate,
      startTime: value.startTime,
      endTime: value.endTime,
      notes: value.notes || undefined,
    };

    this.submitState.set('submitting');

    this.shiftService.createShift(request).subscribe({
      next: () => {
        this.submitState.set('success');
        this.form.reset();
      },
      error: () => {
        this.submitState.set('error');
        this.errorMessage.set('ثبت شیفت با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
      },
    });
  }

  onCreateAnother(): void {
    this.submitState.set('idle');
  }
}
