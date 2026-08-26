import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

import { mockAttendanceRecords, mockTodayAttendanceSummary } from '../../mock-data/mock-data';
import { attendanceStatusMap } from '../../../../shared/utils/status-map';
import { AttendanceRecord, AttendanceStatus } from '../../../../shared/models/center-manager.models';

type AttendanceFilter = 'all' | AttendanceStatus;

/** Visual-only UI state used to preview loading / empty / error presentations. */
type ViewState = 'ready' | 'loading' | 'empty' | 'error';

/**
 * /center/attendance
 * Today's attendance list with summary counts, search, status filter and
 * the four required visual states (loading / empty / error / success-ready).
 */
@Component({
  selector: 'app-center-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
})
export class AttendanceComponent {
  persianDate = 'دوشنبه، ۴ شهریور ۱۴۰۳';
  summary = mockTodayAttendanceSummary;
  attendanceStatusMap = attendanceStatusMap;

  // Change to 'loading' | 'empty' | 'error' to preview each visual state.
  viewState = signal<ViewState>('ready');

  allRecords = mockAttendanceRecords;
  searchTerm = signal('');
  activeFilter = signal<AttendanceFilter>('all');

  filters: { value: AttendanceFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'present', label: 'حاضر' },
    { value: 'late', label: 'تأخیر' },
    { value: 'absent', label: 'غایب' },
    { value: 'onLeave', label: 'مرخصی' },
  ];

  filteredRecords = computed<AttendanceRecord[]>(() => {
    const term = this.searchTerm().trim();
    const filter = this.activeFilter();

    return this.allRecords.filter((rec) => {
      const matchesFilter = filter === 'all' ? true : rec.status === filter;
      const matchesSearch = term.length === 0 || rec.employeeName.includes(term) || rec.role.includes(term);
      return matchesFilter && matchesSearch;
    });
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  setFilter(filter: AttendanceFilter): void {
    this.activeFilter.set(filter);
  }

  onRetry(): void {
    // Visual-only retry — would re-trigger a data fetch when integrated.
    this.viewState.set('ready');
  }
}
