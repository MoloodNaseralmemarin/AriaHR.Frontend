import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaveRequestService } from '../../services/leave-request.service';
import { LeaveRequestDto, LeaveSummaryDto } from '../../models/leave-request.model';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent, BadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
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

        // Compute summary counts from list if summary endpoint isn't separate
        const pending = list.filter((r) => r.status === 'pending').length;
        const approved = list.filter((r) => r.status === 'approved').length;
        const rejected = list.filter((r) => r.status === 'rejected').length;

        this.summary.set({
          pendingCount: pending,
          approvedCount: approved,
          rejectedCount: rejected,
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('خطا در دریافت اطلاعات درخواست‌های مرخصی. لطفاً مجدداً تلاش کنید.');
      },
    });
  }

  openDetails(req: LeaveRequestDto): void {
    this.selectedRequest.set(req);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    setTimeout(() => this.selectedRequest.set(null), 200);
  }

  getDisplayDate(req: LeaveRequestDto): string {
    if (req.leaveType === 'daily') {
      const start = this.persianDateService.toJalaliString(req.startDate, true, 'DD-MM-YYYY');
      const end = this.persianDateService.toJalaliString(req.endDate, true, 'DD-MM-YYYY');
      if (start && end && start !== end) {
        return `${start} تا ${end}`;
      }
      return start || '---';
    } else {
      return this.persianDateService.toJalaliString(req.date, true, 'DD-MM-YYYY') || '---';
    }
  }

  getDisplayRange(req: LeaveRequestDto): string {
    if (req.leaveType === 'hourly' && req.startTime && req.endTime) {
      return `${req.startTime} - ${req.endTime}`;
    }
    return 'کامل روز';
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
