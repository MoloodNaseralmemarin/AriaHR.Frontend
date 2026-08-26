import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

import {
  mockActionRequiredItems,
  mockDashboardNotifications,
  mockDashboardSummary,
  mockEmployeeStatusPreview,
  mockTodayAttendanceSummary,
  mockTodayShifts,
} from '../../mock-data/mock-data';
import { attendanceStatusMap, shiftStatusMap } from '../../../../shared/utils/status-map';

/**
 * /center/dashboard
 * Center Manager landing screen: greeting, today's overview, attendance
 * snapshot, action-required queue, today's shifts and a quick employee /
 * notifications preview. All data is mock — no HTTP calls.
 */
@Component({
  selector: 'app-center-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SummaryCardComponent, StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  managerName = 'دکتر کاظمی';
  centerName = 'مرکز سلامت بهار';
  persianDate = 'دوشنبه، ۴ شهریور ۱۴۰۳';

  summary = mockDashboardSummary;
  todayAttendance = mockTodayAttendanceSummary;
  actionItems = mockActionRequiredItems;
  todayShifts = mockTodayShifts;
  employeePreview = mockEmployeeStatusPreview;
  notifications = mockDashboardNotifications;

  attendanceStatusMap = attendanceStatusMap;
  shiftStatusMap = shiftStatusMap;

  get hasActionItems(): boolean {
    return this.actionItems.length > 0;
  }

  onActionClick(id: string): void {
    // Visual-only: in the integrated app this would navigate to the
    // relevant filtered list (e.g. Requests screen with a status filter).
    console.log('action required clicked (UI only):', id);
  }
}
