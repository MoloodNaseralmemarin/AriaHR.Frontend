import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { BadgeTone, StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { LeaveRequestService } from '../../../employee/services/leave-request.service';
import { LeaveRequestDto, LeaveRequestStatus, LeaveType } from '../../../employee/models/leave-request.model';
import { formatTimeRange } from '../../../../shared/utils/time.util';

type StatusFilterOption = 'all' | LeaveRequestStatus;
type TypeFilterOption = 'all' | LeaveType;

@Component({
  selector: 'app-center-manager-leave-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    SummaryCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    PersianDigitsPipe,
    JalaliPipe,
  ],
  templateUrl: './center-manager-leave-requests-list.component.html',
  styleUrls: ['./center-manager-leave-requests-list.component.css'],
})
export class CenterManagerLeaveRequestsListComponent implements OnInit {
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly requests = signal<LeaveRequestDto[]>([]);

  readonly selectedStatusFilter = signal<StatusFilterOption>('all');
  readonly selectedTypeFilter = signal<TypeFilterOption>('all');
  readonly searchTerm = signal('');

  readonly summary = computed(() => {
    const list = this.requests();
    return {
      totalCount: list.length,
      pendingCount: list.filter((r) => r.status === 'pending').length,
      approvedCount: list.filter((r) => r.status === 'approved').length,
      rejectedCount: list.filter((r) => r.status === 'rejected').length,
    };
  });

  readonly filteredRequests = computed(() => {
    let list = this.requests();
    const status = this.selectedStatusFilter();
    const type = this.selectedTypeFilter();
    const term = this.searchTerm().trim().toLowerCase();

    if (status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    if (type !== 'all') {
      list = list.filter((r) => r.leaveType === type);
    }

    if (term) {
      list = list.filter(
        (r) =>
          (r.employeeName && r.employeeName.toLowerCase().includes(term)) ||
          (r.categoryName && r.categoryName.toLowerCase().includes(term)) ||
          (r.reason && r.reason.toLowerCase().includes(term))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const statusParam = params['status'];
      if (statusParam && ['pending', 'approved', 'rejected', 'cancelled'].includes(statusParam.toLowerCase())) {
        this.selectedStatusFilter.set(statusParam.toLowerCase() as LeaveRequestStatus);
      }
    });

    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.leaveRequestService.getAllLeaveRequests().subscribe({
      next: (data) => {
        this.requests.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        const message =
          err?.error?.message ||
          err?.message ||
          'خطایی در دریافت لیست درخواست‌های مرخصی رخ داد.';
        this.errorMsg.set(message);
        this.isLoading.set(false);
      },
    });
  }

  setStatusFilter(filter: StatusFilterOption): void {
    this.selectedStatusFilter.set(filter);
  }

  setTypeFilter(filter: TypeFilterOption): void {
    this.selectedTypeFilter.set(filter);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  getStatusLabel(status: LeaveRequestStatus): string {
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

  getStatusTone(status: LeaveRequestStatus): BadgeTone {
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

  getLeaveTypeLabel(type: LeaveType): string {
    return type === 'hourly' ? 'ساعتی' : 'روزانه';
  }

  getTimeDisplay(req: LeaveRequestDto): string {
    if (req.leaveType === 'hourly' && req.startTime && req.endTime) {
      return formatTimeRange(req.startTime, req.endTime);
    }
    return '---';
  }
}
