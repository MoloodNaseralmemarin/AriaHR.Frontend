import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JalaliDatePickerComponent } from '../../../../shared/components/jalali-date-picker/jalali-date-picker.component';
import { TimeInputComponent } from '../../../../shared/components/time-input/time-input.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { LeaveRequestService } from '../../services/leave-request.service';
import { CreateLeaveRequestDto, LeaveType } from '../../models/leave-request.model';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-leave-request-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    JalaliDatePickerComponent,
    TimeInputComponent,
    ToastComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './leave-request-form.component.html',
  styleUrls: ['./leave-request-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRequestFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly persianDateService = inject(PersianDateService);

  readonly selectedLeaveType = signal<LeaveType>('daily');
  readonly isSubmitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);

  // Toast state
  readonly showToast = signal<boolean>(false);
  readonly toastMessage = signal<string>('');
  readonly toastTone = signal<ToastTone>('success');

  readonly form: FormGroup = this.fb.group({
    leaveType: ['daily', [Validators.required]],
    startDate: [''],
    endDate: [''],
    date: [''],
    startTime: [''],
    endTime: [''],
    reason: ['', [Validators.maxLength(500)]],
  });

  readonly reasonLength = signal<number>(0);

  // Computed Duration calculation
  readonly computedDuration = computed(() => {
    const type = this.selectedLeaveType();
    if (type === 'daily') {
      const start = this.form.get('startDate')?.value;
      const end = this.form.get('endDate')?.value;
      if (!start || !end) return '';

      const dStart = new Date(start);
      const dEnd = new Date(end);
      if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return '';

      const diffTime = dEnd.getTime() - dStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 0) return '';
      return `${diffDays} روز`;
    } else {
      const startTime = this.form.get('startTime')?.value;
      const endTime = this.form.get('endTime')?.value;
      if (!startTime || !endTime) return '';

      const [sHours, sMins] = startTime.split(':').map(Number);
      const [eHours, eMins] = endTime.split(':').map(Number);

      if (isNaN(sHours) || isNaN(sMins) || isNaN(eHours) || isNaN(eMins)) return '';

      const startTotalMinutes = sHours * 60 + sMins;
      const endTotalMinutes = eHours * 60 + eMins;

      const diffMinutes = endTotalMinutes - startTotalMinutes;
      if (diffMinutes <= 0) return '';

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours} ساعت و ${minutes} دقیقه`;
      } else if (hours > 0) {
        return `${hours} ساعت`;
      } else {
        return `${minutes} دقیقه`;
      }
    }
  });

  // Summary display signals
  readonly formattedSummaryDate = computed(() => {
    const type = this.selectedLeaveType();
    if (type === 'hourly') {
      const dateVal = this.form.get('date')?.value;
      return dateVal ? this.persianDateService.toJalaliString(dateVal, true, 'DD-MM-YYYY') : '---';
    } else {
      const startVal = this.form.get('startDate')?.value;
      return startVal ? this.persianDateService.toJalaliString(startVal, true, 'DD-MM-YYYY') : '---';
    }
  });

  readonly formattedSummaryEndDate = computed(() => {
    const endVal = this.form.get('endDate')?.value;
    return endVal ? this.persianDateService.toJalaliString(endVal, true, 'DD-MM-YYYY') : '---';
  });

  constructor() {
    // Listen to form value changes
    this.form.valueChanges.subscribe((val) => {
      this.reasonLength.set((val.reason || '').length);
    });
  }

  setLeaveType(type: LeaveType) {
    this.selectedLeaveType.set(type);
    this.form.patchValue({ leaveType: type });
    this.formError.set(null);
  }

  onSubmit() {
    this.formError.set(null);
    const type = this.selectedLeaveType();

    if (type === 'daily') {
      const startDate = this.form.get('startDate')?.value;
      const endDate = this.form.get('endDate')?.value;

      if (!startDate || !endDate) {
        this.formError.set('لطفاً تاریخ شروع و پایان مرخصی را وارد کنید.');
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        this.formError.set('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.');
        return;
      }
    } else {
      const date = this.form.get('date')?.value;
      const startTime = this.form.get('startTime')?.value;
      const endTime = this.form.get('endTime')?.value;

      if (!date || !startTime || !endTime) {
        this.formError.set('لطفاً تاریخ، ساعت شروع و ساعت پایان را وارد کنید.');
        return;
      }

      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);

      if (eH * 60 + eM <= sH * 60 + sM) {
        this.formError.set('ساعت پایان باید بعد از ساعت شروع باشد.');
        return;
      }
    }

    if (this.form.invalid) {
      this.formError.set('اطلاعات وارد شده معتبر نمی‌باشد.');
      return;
    }

    this.isSubmitting.set(true);

    const formVal = this.form.value;
    const dto: CreateLeaveRequestDto = {
      leaveType: type,
      startDate: type === 'daily' ? formVal.startDate : undefined,
      endDate: type === 'daily' ? formVal.endDate : undefined,
      date: type === 'hourly' ? formVal.date : undefined,
      startTime: type === 'hourly' ? formVal.startTime : undefined,
      endTime: type === 'hourly' ? formVal.endTime : undefined,
      reason: formVal.reason?.trim() || undefined,
    };

    this.leaveRequestService.createLeaveRequest(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.triggerToast('درخواست مرخصی با موفقیت ثبت شد.', 'success');
        setTimeout(() => {
          this.router.navigate(['/employee/leave-requests']);
        }, 1200);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.formError.set('ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.');
        this.triggerToast('ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.', 'error');
      },
    });
  }

  private triggerToast(message: string, tone: ToastTone) {
    this.toastMessage.set(message);
    this.toastTone.set(tone);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
