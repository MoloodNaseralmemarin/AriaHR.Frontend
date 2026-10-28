import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LeaveRequestService } from '../../../employee/services/leave-request.service';
import { LeaveRequestDetailDto } from '../../../employee/models/leave-request.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BadgeTone, StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { formatTimeRange } from '../../../../shared/utils/time.util';

export type ReviewActionType = 'approve' | 'reject';

@Component({
  selector: 'app-leave-request-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ToastComponent,
    PersianDigitsPipe,
    JalaliPipe,
  ],
  templateUrl: './leave-request-details.component.html',
  styleUrl: './leave-request-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRequestDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly dateService = inject(PersianDateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly request = signal<LeaveRequestDetailDto | null>(null);

  // Review modal state
  readonly activeModal = signal<ReviewActionType | null>(null);
  readonly isSubmitting = signal(false);
  readonly reviewComment = signal('');
  readonly commentError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);

  // Toast state
  readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<ToastTone>('success');

  private toastTimeout: any;

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.loadLeaveRequestDetails();
    });
  }

  goBack(): void {
    this.location.back();
  }

  loadLeaveRequestDetails(): void {
    const requestId = this.route.snapshot.paramMap.get('id');

    if (!requestId) {
      this.error.set('شناسه درخواست مرخصی معتبر نیست.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.leaveRequestService.getLeaveRequestById(requestId).subscribe({
      next: (data) => {
        if (data && data.id) {
          this.request.set(data);
        } else {
          this.error.set('درخواست مرخصی مورد نظر یافت نشد.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        const message =
          err?.error?.message ||
          err?.error?.title ||
          err?.message ||
          'خطایی در دریافت اطلاعات درخواست مرخصی رخ داد. لطفاً مجدداً تلاش کنید.';
        this.error.set(message);
        this.loading.set(false);
      },
    });
  }

  openReviewModal(action: ReviewActionType): void {
    const current = this.request();
    if (!current || current.status !== 'pending') {
      return;
    }
    this.activeModal.set(action);
    this.reviewComment.set('');
    this.commentError.set(null);
    this.submitError.set(null);
  }

  closeModal(): void {
    if (this.isSubmitting()) return;
    this.activeModal.set(null);
    this.reviewComment.set('');
    this.commentError.set(null);
    this.submitError.set(null);
  }

  onCommentInput(val: string): void {
    this.reviewComment.set(val);
    if (val.length > 500) {
      this.commentError.set('توضیحات نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.');
    } else {
      this.commentError.set(null);
    }
  }

  submitDecision(): void {
    const action = this.activeModal();
    const current = this.request();

    if (!action || !current || current.status !== 'pending' || this.isSubmitting()) {
      return;
    }

    const commentVal = this.reviewComment().trim();

    if (commentVal.length > 500) {
      this.commentError.set('توضیحات نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    if (action === 'approve') {
      this.leaveRequestService.approveLeaveRequest(current.id, commentVal).subscribe({
        next: (updated) => {
          this.request.set(updated);
          this.isSubmitting.set(false);
          this.activeModal.set(null);
          this.showToast('درخواست مرخصی با موفقیت تأیید شد.', 'success');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.error?.message || err?.error?.title || 'خطا در ثبت تأیید درخواست. لطفاً مجدداً تلاش کنید.';
          this.submitError.set(msg);
        },
      });
    } else if (action === 'reject') {
      this.leaveRequestService.rejectLeaveRequest(current.id, commentVal).subscribe({
        next: (updated) => {
          this.request.set(updated);
          this.isSubmitting.set(false);
          this.activeModal.set(null);
          this.showToast('درخواست مرخصی با موفقیت رد شد.', 'success');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.error?.message || err?.error?.title || 'خطا در ثبت رد درخواست. لطفاً مجدداً تلاش کنید.';
          this.submitError.set(msg);
        },
      });
    }
  }

  showToast(msg: string, tone: ToastTone = 'success'): void {
    this.toastMessage.set(msg);
    this.toastTone.set(tone);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  getDisplayValue(value: string | null | undefined): string {
    if (!value || !value.trim()) {
      return 'ثبت نشده';
    }
    return value.trim();
  }

  getReviewerDisplay(req: LeaveRequestDetailDto): string {
    if (req.status === 'pending') {
      return 'در انتظار بررسی';
    }

    const val = req.approvedBy ? req.approvedBy.trim() : '';

    if (!val) {
      return 'ثبت نشده';
    }

    // Check if approvedBy is a raw GUID pattern (e.g. 8-4-4-4-12 hex chars)
    const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    const currentUserDetails = this.authService.userDetails();
    const currentAuthUser = this.authService.currentUser();
    const currentUserId = currentUserDetails?.id || currentAuthUser?.id;

    if (currentUserId && val.toLowerCase() === currentUserId.toLowerCase()) {
      const first = currentUserDetails?.firstName || '';
      const last = currentUserDetails?.lastName || '';
      const name = `${first} ${last}`.trim();
      return name ? `شما (${name})` : 'شما (مدیر مرکز)';
    }

    if (isGuid) {
      return 'مدیر مرکز';
    }

    return val;
  }

  getEmployeeName(req: LeaveRequestDetailDto): string {
    if (req.employeeFullName && req.employeeFullName.trim()) {
      return req.employeeFullName.trim();
    }
    const first = req.employeeFirstName ? req.employeeFirstName.trim() : '';
    const last = req.employeeLastName ? req.employeeLastName.trim() : '';
    const full = `${first} ${last}`.trim();
    return full || 'ثبت نشده';
  }

  getLeaveTypeLabel(leaveType: 'daily' | 'hourly'): string {
    return leaveType === 'hourly' ? 'ساعتی' : 'روزانه';
  }

  getStatusLabel(status: 'pending' | 'approved' | 'rejected' | 'cancelled'): string {
    switch (status) {
      case 'approved':
        return 'تأیید شده';
      case 'rejected':
        return 'رد شده';
      case 'cancelled':
        return 'لغو شده';
      case 'pending':
      default:
        return 'در انتظار بررسی';
    }
  }

  getStatusBadgeTone(status: string | null | undefined): BadgeTone {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'neutral';
      case 'pending':
      default:
        return 'warning';
    }
  }

  getTimeRangeDisplay(startTime: string | null, endTime: string | null): string {
    if (!startTime && !endTime) {
      return 'ثبت نشده';
    }
    return formatTimeRange(startTime, endTime);
  }

  getDateDisplay(req: LeaveRequestDetailDto): string {
    if (req.leaveType === 'hourly') {
      return req.startDate ? this.dateService.toJalaliString(req.startDate) : 'ثبت نشده';
    }

    if (req.startDate && req.endDate && req.startDate !== req.endDate) {
      return this.dateService.formatDateRange(req.startDate, req.endDate);
    }

    return req.startDate ? this.dateService.toJalaliString(req.startDate) : 'ثبت نشده';
  }
}
