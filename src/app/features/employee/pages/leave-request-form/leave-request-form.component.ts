import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JalaliDatePickerComponent } from '../../../../shared/components/jalali-date-picker/jalali-date-picker.component';
import { TimeInputComponent } from '../../../../shared/components/time-input/time-input.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveCategoryService } from '../../../leave-categories/services/leave-category.service';
import { LeaveCategoryDto } from '../../../leave-categories/models/leave-category.dto';
import { CreateLeaveRequestApiDto, LeaveType } from '../../models/leave-request.model';
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
export class LeaveRequestFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly leaveCategoryService = inject(LeaveCategoryService);
  private readonly persianDateService = inject(PersianDateService);

  readonly selectedLeaveType = signal<LeaveType>('daily');
  readonly isSubmitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);

  // Leave Categories state
  readonly categories = signal<LeaveCategoryDto[]>([]);
  readonly isLoadingCategories = signal<boolean>(false);
  readonly categoriesError = signal<string | null>(null);

  // Toast state
  readonly showToast = signal<boolean>(false);
  readonly toastMessage = signal<string>('');
  readonly toastTone = signal<ToastTone>('success');

  readonly form: FormGroup = this.fb.group({
    leaveType: ['daily', [Validators.required]],
    leaveCategoryId: ['', [Validators.required]],
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
      return dateVal ? this.persianDateService.toJalaliString(dateVal) : '---';
    } else {
      const startVal = this.form.get('startDate')?.value;
      return startVal ? this.persianDateService.toJalaliString(startVal) : '---';
    }
  });

  readonly formattedSummaryEndDate = computed(() => {
    const endVal = this.form.get('endDate')?.value;
    return endVal ? this.persianDateService.toJalaliString(endVal) : '---';
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoriesError.set(null);

    this.leaveCategoryService.getAll().subscribe({
      next: (list) => {
        this.categories.set(list || []);
        this.isLoadingCategories.set(false);
      },
      error: (err) => {
        this.isLoadingCategories.set(false);
        if (err?.status === 403) {
          this.categoriesError.set('شما دسترسی لازم برای دریافت دسته‌بندی‌های مرخصی را ندارید. این موضوع نیازمند اصلاح در سمت سرور توسط مدیر سیستم می‌باشد.');
        } else {
          this.categoriesError.set('خطا در دریافت لیست دسته‌بندی‌های مرخصی.');
        }
      },
    });
  }

  constructor() {
    // Listen to form value changes
    this.form.valueChanges.subscribe((val) => {
      this.reasonLength.set((val.reason || '').length);
    });
  }

  setLeaveType(type: LeaveType) {
    this.selectedLeaveType.set(type);
    this.formError.set(null);

    if (type === 'daily') {
      this.form.patchValue({
        leaveType: 'daily',
        date: '',
        startTime: '',
        endTime: '',
      });
    } else {
      this.form.patchValue({
        leaveType: 'hourly',
        startDate: '',
        endDate: '',
      });
    }
  }

  onSubmit() {
    if (this.isSubmitting()) {
      return;
    }

    this.formError.set(null);
    const type = this.selectedLeaveType();

    if (!this.form.get('leaveCategoryId')?.value) {
      this.formError.set('لطفاً دسته مرخصی را انتخاب کنید.');
      return;
    }

    if (type === 'daily') {
      const startDate = this.form.get('startDate')?.value;
      const endDate = this.form.get('endDate')?.value;

      if (!startDate || !endDate) {
        this.formError.set('لطفاً تاریخ شروع و پایان مرخصی را وارد کنید.');
        return;
      }

      const gregStart = this.toGregorian(startDate);
      const gregEnd = this.toGregorian(endDate);

      if (new Date(gregEnd) < new Date(gregStart)) {
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
    const gregStartDate = type === 'daily' ? this.toGregorian(formVal.startDate) : this.toGregorian(formVal.date);
    const gregEndDate = type === 'daily' ? this.toGregorian(formVal.endDate) : this.toGregorian(formVal.date);

    const apiDto: CreateLeaveRequestApiDto = {
      leaveType: type === 'daily' ? 1 : 2,
      leaveCategoryId: formVal.leaveCategoryId,
      startDate: gregStartDate,
      endDate: gregEndDate,
      startTime: type === 'hourly' && formVal.startTime ? formVal.startTime : null,
      endTime: type === 'hourly' && formVal.endTime ? formVal.endTime : null,
      reason: formVal.reason?.trim() ? formVal.reason.trim() : null,
    };

    this.leaveRequestService.createLeaveRequest(apiDto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.triggerToast('درخواست مرخصی با موفقیت ثبت شد.', 'success');
        setTimeout(() => {
          this.router.navigate(['/employee/leave-requests']);
        }, 1200);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        let msg = 'ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.';

        if (err?.status === 0) {
          msg = 'عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
        } else if (err?.status === 401) {
          msg = 'شما وارد سیستم نشده‌اید. لطفاً مجدداً وارد شوید.';
        } else if (err?.status === 403) {
          msg = 'شما دسترسی لازم برای ثبت این درخواست را ندارید.';
        } else if (err?.error) {
          if (typeof err.error === 'string') {
            msg = err.error;
          } else if (err.error.detail) {
            msg = err.error.detail;
          } else if (err.error.message) {
            msg = err.error.message;
          } else if (err.error.title) {
            msg = err.error.title;
          } else if (err.error.errors && typeof err.error.errors === 'object') {
            const errorValues = Object.values(err.error.errors).flat();
            if (errorValues.length > 0 && typeof errorValues[0] === 'string') {
              msg = errorValues[0];
            }
          }
        }
        this.formError.set(msg);
        this.triggerToast(msg, 'error');
      },
    });
  }

  private toGregorian(dateVal: string | null | undefined): string {
    if (!dateVal) return '';
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const year = parseInt(trimmed.substring(0, 4), 10);
      if (year >= 1900 && year <= 2100) {
        return trimmed;
      }
    }
    return this.persianDateService.toGregorianString(trimmed) || trimmed;
  }

  private triggerToast(message: string, tone: ToastTone) {
    this.toastMessage.set(message);
    this.toastTone.set(tone);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
