import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveRequestDto, LeaveSummaryDto, LeaveType, LeaveRequestStatus } from '../../models/leave-request.model';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent, BadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { formatTimeRange } from '../../../../shared/utils/time.util';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-leave-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SummaryCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    ToastComponent,
    JalaliPipe,
    PersianDigitsPipe,
  ],
  templateUrl: './leave-requests-list.component.html',
  styleUrls: ['./leave-requests-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRequestsListComponent implements OnInit {
  private readonly leaveRequestService = inject(LeaveRequestService);
  readonly persianDateService = inject(PersianDateService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMsg = signal<string | null>(null);

  readonly requests = signal<LeaveRequestDto[]>([]);
  readonly summary = signal<LeaveSummaryDto>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });

  // Filtering signals
  readonly selectedStatusFilter = signal<LeaveRequestStatus | 'all'>('all');
  readonly selectedTypeFilter = signal<LeaveType | 'all'>('all');

  // Computed filtered list
  readonly filteredRequests = computed(() => {
    const list = this.requests();
    const statusFilter = this.selectedStatusFilter();
    const typeFilter = this.selectedTypeFilter();

    return list.filter((req) => {
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchType = typeFilter === 'all' || req.leaveType === typeFilter;
      return matchStatus && matchType;
    });
  });

  // Selected request for Details Drawer
  readonly selectedRequest = signal<LeaveRequestDto | null>(null);
  readonly isDrawerOpen = signal<boolean>(false);

  // Toast
  readonly showToast = signal<boolean>(false);
  readonly toastMessage = signal<string>('');
  readonly toastTone = signal<ToastTone>('info');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.leaveRequestService.getLeaveRequests().subscribe({
      next: (data) => {
        const list = data || [];
        this.requests.set(list);
        this.computeSummaryFromList(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('خطا در دریافت اطلاعات درخواست‌های مرخصی. لطفاً مجدداً تلاش کنید.');
      },
    });
  }

  private computeSummaryFromList(list: LeaveRequestDto[]): void {
    const pending = list.filter((r) => r.status === 'pending').length;
    const approved = list.filter((r) => r.status === 'approved').length;
    const rejected = list.filter((r) => r.status === 'rejected').length;

    this.summary.set({
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
    });
  }

  setStatusFilter(status: LeaveRequestStatus | 'all'): void {
    this.selectedStatusFilter.set(status);
  }

  setTypeFilter(type: LeaveType | 'all'): void {
    this.selectedTypeFilter.set(type);
  }

  resetFilters(): void {
    this.selectedStatusFilter.set('all');
    this.selectedTypeFilter.set('all');
  }

  openDetails(req: LeaveRequestDto): void {
    this.selectedRequest.set(req);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    setTimeout(() => this.selectedRequest.set(null), 200);
  }

  /**
   * Safe check to filter out invalid dates like '0001-01-01' or empty values.
   */
  private isInvalidDate(dateStr?: string): boolean {
    if (!dateStr) return true;
    return dateStr.startsWith('0001-01-01') || dateStr.startsWith('0001-01-02');
  }

  getDisplayDate(req: LeaveRequestDto): string {
    if (req.leaveType === 'daily') {
      if (this.isInvalidDate(req.startDate)) return 'تعیین نشده';
      const start = this.persianDateService.toJalaliString(req.startDate);
      if (this.isInvalidDate(req.endDate)) return start || 'تعیین نشده';
      const end = this.persianDateService.toJalaliString(req.endDate);

      if (start && end && start !== end) {
        return `${start} تا ${end}`;
      }
      return start || 'تعیین نشده';
    } else {
      if (this.isInvalidDate(req.date)) {
        if (!this.isInvalidDate(req.startDate)) {
          return this.persianDateService.toJalaliString(req.startDate) || 'تعیین نشده';
        }
        return 'تعیین نشده';
      }
      return this.persianDateService.toJalaliString(req.date) || 'تعیین نشده';
    }
  }

  getDisplayRange(req: LeaveRequestDto): string {
    if (req.leaveType === 'hourly') {
      return formatTimeRange(req.startTime, req.endTime);
    }
    return 'روز کامل';
  }

  getDisplayDuration(req: LeaveRequestDto): string {
    if (req.durationText && req.durationText.trim().length > 0) {
      return req.durationText;
    }
    if (req.leaveType === 'daily') {
      if (!this.isInvalidDate(req.startDate) && !this.isInvalidDate(req.endDate)) {
        const d1 = new Date(req.startDate!);
        const d2 = new Date(req.endDate!);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
          return `${diffDays} روز`;
        }
      }
      return '۱ روز';
    }
    return 'تعیین نشده';
  }

  getStatusBadgeTone(status: string): BadgeTone {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'neutral';
      default:
        return 'warning';
    }
  }

  getStatusBadgeLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'تأیید شده';
      case 'rejected':
        return 'رد شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return 'در انتظار بررسی';
    }
  }
}
