import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { finalize } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import {
  ATTENDANCE_CORRECTION_STATUSES,
  formatAttendanceTime,
  getAttendanceStatusMeta,
  toApiDate,
} from '../../../../shared/utils/attendance-status.util';
import { AuthService } from '../../../../core/auth/auth.service';
import { AttendanceService } from '../../../employee/services/attendance.service';
import {
  AttendanceRecordDto,
  UpdateAttendanceStatusRequestDto,
} from '../../../employee/models/employee-attendance.models';
import { resolveAttendanceErrorMessage } from '../../../employee/utils/attendance-error.util';

type AttendanceFilter = 'all' | 'open' | 'completed' | 'approved';

interface AttendanceRow {
  record: AttendanceRecordDto;
  employeeName: string;
  avatarInitials: string;
  checkIn: string;
  checkOut: string;
  status: ReturnType<typeof getAttendanceStatusMeta>;
}

@Component({
  selector: 'app-center-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    PersianDigitsPipe,
    JalaliPipe,
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly records = signal<AttendanceRecordDto[]>([]);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<AttendanceFilter>('all');

  /** Default report window: today. */
  readonly startDate = signal(toApiDate(new Date()));
  readonly endDate = signal(toApiDate(new Date()));

  readonly correctionStatuses = ATTENDANCE_CORRECTION_STATUSES;
  readonly correctingRecord = signal<AttendanceRecordDto | null>(null);
  readonly isSavingCorrection = signal(false);
  readonly correctionError = signal<string | null>(null);

  readonly correctionForm = this.fb.group({
    status: ['Present', [Validators.required]],
    notes: [''],
  });

  readonly filters: { value: AttendanceFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'open', label: 'حاضر در محل' },
    { value: 'completed', label: 'پایان‌یافته' },
    { value: 'approved', label: 'تأییدشده' },
  ];

  readonly rows = computed<AttendanceRow[]>(() =>
    this.records().map((record) => {
      const employeeName = record.employeeFullName?.trim() || 'کارمند بدون نام';
      return {
        record,
        employeeName,
        avatarInitials: toInitials(employeeName),
        checkIn: formatAttendanceTime(record.checkInTime),
        checkOut: formatAttendanceTime(record.checkOutTime),
        status: getAttendanceStatusMeta(record.status),
      };
    })
  );

  readonly filteredRows = computed<AttendanceRow[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.rows().filter((row) => {
      const status = (row.record.status ?? '').toLowerCase();
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'open'
            ? !row.record.checkOutTime
            : filter === 'completed'
              ? status === 'completed'
              : status === 'approved';

      const matchesSearch = !term || row.employeeName.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  });

  readonly summary = computed(() => {
    const records = this.records();
    return {
      total: records.length,
      open: records.filter((record) => !record.checkOutTime).length,
      completed: records.filter((record) => (record.status ?? '').toLowerCase() === 'completed').length,
      approved: records.filter((record) => (record.status ?? '').toLowerCase() === 'approved').length,
    };
  });

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const organizationId = this.authService.userDetails()?.organizationId ?? undefined;

    this.attendanceService
      .getOrganizationAttendance({
        organizationId,
        startDate: this.startDate(),
        endDate: this.endDate(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (records) => this.records.set(records ?? []),
        error: (error) => {
          this.records.set([]);
          this.errorMessage.set(resolveAttendanceErrorMessage(error));
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  setFilter(filter: AttendanceFilter): void {
    this.activeFilter.set(filter);
  }

  onStartDateChange(value: string): void {
    if (!value) {
      return;
    }
    this.startDate.set(value);
    this.loadAttendance();
  }

  onEndDateChange(value: string): void {
    if (!value) {
      return;
    }
    this.endDate.set(value);
    this.loadAttendance();
  }

  onRetry(): void {
    this.loadAttendance();
  }

  openCorrection(record: AttendanceRecordDto): void {
    this.correctingRecord.set(record);
    this.correctionError.set(null);
    this.correctionForm.reset({
      status: ATTENDANCE_CORRECTION_STATUSES.includes(record.status) ? record.status : 'Present',
      notes: '',
    });
  }

  closeCorrection(): void {
    if (this.isSavingCorrection()) {
      return;
    }
    this.correctingRecord.set(null);
    this.correctionError.set(null);
  }

  submitCorrection(): void {
    const record = this.correctingRecord();
    if (!record || this.isSavingCorrection()) {
      return;
    }

    if (this.correctionForm.invalid) {
      this.correctionForm.markAllAsTouched();
      return;
    }

    const value = this.correctionForm.getRawValue();
    const request: UpdateAttendanceStatusRequestDto = {
      status: value.status.trim(),
      notes: value.notes.trim() || null,
    };

    this.isSavingCorrection.set(true);
    this.correctionError.set(null);

    this.attendanceService
      .updateAttendanceStatus(record.id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingCorrection.set(false))
      )
      .subscribe({
        next: (updated) => {
          this.records.update((records) =>
            records.map((item) => (item.id === updated.id ? updated : item))
          );
          this.correctingRecord.set(null);
        },
        error: (error) => this.correctionError.set(resolveAttendanceErrorMessage(error)),
      });
  }
}

function toInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '؟';
  }
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? (parts[1]?.charAt(0) ?? '') : '';
  return `${first}${second}`;
}
