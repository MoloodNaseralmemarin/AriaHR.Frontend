import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ShiftService } from '../../services/shift.service';
import { CreateShiftDto } from '../../models/create-shift.dto';

/**
 * /center/shifts/create
 * Center Manager → درج شیفت (Create Shift)
 *
 * ASSUMPTION FLAGGED: the real dashboard.component.html / .css were not
 * available when this was built (see conversation), so the markup below
 * follows the *pattern* inferred from dashboard.component.ts (rounded
 * card sections, RTL, shared components, Persian labels, signal-based
 * state) rather than a pixel-confirmed copy of the existing page. Once
 * the real template/CSS are provided, this should be re-checked against
 * them (spacing, exact Tailwind classes, card shadow/border tokens).
 *
 * Employee list is mock data, matching the pattern the dashboard used
 * before it was wired to real APIs — this should move into the
 * feature's existing `mock-data/mock-data.ts` file (or a real
 * EmployeeService) instead of living inline, once that file is visible.
 */

interface EmployeeOption {
  id: string;
  fullName: string;
}

const mockEmployeeOptions: EmployeeOption[] = [
  { id: 'emp-1', fullName: 'زهرا احمدی' },
  { id: 'emp-2', fullName: 'علی رضایی' },
  { id: 'emp-3', fullName: 'مریم کاظمی' },
  { id: 'emp-4', fullName: 'حسین موسوی' },
];

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

  readonly employeeOptions = mockEmployeeOptions;

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

  get f() {
    return this.form.controls;
  }

  /** true when endTime is not strictly after startTime, once both are set */
  readonly timeRangeInvalid = computed(() => {
    const start = this.form.getRawValue().startTime;
    const end = this.form.getRawValue().endTime;
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
