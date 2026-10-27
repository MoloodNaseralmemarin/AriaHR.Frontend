import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { LeaveRequestService } from '../../../employee/services/leave-request.service';
import { LeaveRequestDetailDto } from '../../../employee/models/leave-request.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent, BadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { formatTimeRange } from '../../../../shared/utils/time.util';

@Component({
  selector: 'app-leave-request-details',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
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
  private readonly location = inject(Location);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly request = signal<LeaveRequestDetailDto | null>(null);

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

  getDisplayValue(value: string | null | undefined): string {
    if (!value || !value.trim()) {
      return 'ثبت نشده';
    }
    return value.trim();
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

  getStatusLabel(status: 'pending' | 'approved' | 'rejected' | 'cancelled' | string | null | undefined): string {
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

  getTimeRangeDisplay(startTime: string | null, endTime: string | null): string {
    if (!startTime && !endTime) {
      return 'ثبت نشده';
    }
    return formatTimeRange(startTime, endTime);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'ثبت نشده';
    return dateStr;
  }
}
