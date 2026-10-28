import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { CenterManagerDashboardService } from '../../services/center-manager-dashboard.service';
import { CenterManagerDashboardDto } from '../../models/center-manager-dashboard.dto';

import {
  mockDashboardNotifications,
  mockEmployeeStatusPreview,
  mockTodayAttendanceSummary,
  mockTodayShifts,
} from '../../mock-data/mock-data';
import { attendanceStatusMap, shiftStatusMap } from '../../../../shared/utils/status-map';

/**
 * /center-manager/dashboard
 * Center Manager landing screen: greeting, today's overview stats from API,
 * attendance snapshot, action-required queue, today's shifts and a quick employee /
 * notifications preview.
 */
@Component({
  selector: 'app-center-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SummaryCardComponent,
    StatusBadgeComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly persianDateService = inject(PersianDateService);
  private readonly dashboardService = inject(CenterManagerDashboardService);

  readonly managerNameSignal = computed(() => {
    const details = this.authService.userDetails();
    if (details) {
      const first = details.firstName ? details.firstName.trim() : '';
      const last = details.lastName ? details.lastName.trim() : '';
      const full = `${first} ${last}`.trim();
      if (full) {
        return full;
      }
    }

    const user = this.authService.currentUser();
    if (user) {
      if (user.fullName && user.fullName.trim()) {
        return user.fullName.trim();
      }
    }

    return 'مدیر مرکز';
  });

  get managerName(): string {
    return this.managerNameSignal();
  }

  readonly centerNameSignal = computed(() => {
    const details = this.authService.userDetails();
    if (details && details.organizationName && details.organizationName.trim()) {
      return details.organizationName.trim();
    }
    return 'تعیین نشده';
  });

  get centerName(): string {
    return this.centerNameSignal();
  }

  readonly persianDate = this.persianDateService.getTodayFormatted();

  // Dashboard API state
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly metrics = signal<CenterManagerDashboardDto | null>(null);

  todayAttendance = mockTodayAttendanceSummary;
  todayShifts = mockTodayShifts;
  employeePreview = mockEmployeeStatusPreview;
  notifications = mockDashboardNotifications;

  attendanceStatusMap = attendanceStatusMap;
  shiftStatusMap = shiftStatusMap;

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.authService.getCurrentUser().subscribe({
        error: () => {
          // Fallback handled gracefully in managerNameSignal
        },
      });
    }

    this.loadDashboardMetrics();
  }

  loadDashboardMetrics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getDashboardMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('خطا در دریافت اطلاعات داشبورد. لطفاً دوباره تلاش کنید.');
        this.isLoading.set(false);
      },
    });
  }

}
