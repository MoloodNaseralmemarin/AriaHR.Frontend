import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { PersianDateService } from '../../../../core/services/persian-date.service';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import {
  formatAttendanceTime,
  formatWorkDuration,
  getAttendanceStatusMeta,
  toApiDate,
} from '../../../../shared/utils/attendance-status.util';
import { AttendanceService } from '../../services/attendance.service';
import {
  AttendanceRecordDto,
  AttendanceScanResponseDto,
  ScanAttendanceRequestDto,
} from '../../models/employee-attendance.models';
import { QrScannerComponent } from '../../components/qr-scanner/qr-scanner.component';
import { resolveAttendanceErrorMessage } from '../../utils/attendance-error.util';

export type AttendanceViewState =
  | 'loading'
  | 'ready'
  | 'scanner'
  | 'gettingLocation'
  | 'submitting'
  | 'success'
  | 'error';

/** History window shown under today's card. */
const HISTORY_DAYS = 14;

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    PersianDigitsPipe,
    JalaliPipe,
    StatusBadgeComponent,
    QrScannerComponent,
  ],
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendanceComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly persianDateService = inject(PersianDateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly viewState = signal<AttendanceViewState>('loading');
  readonly errorMessage = signal<string | null>(null);
  readonly lastResult = signal<AttendanceScanResponseDto | null>(null);

  /** Open attendance record of the current employee (GET /api/attendance/current). */
  readonly currentRecord = signal<AttendanceRecordDto | null>(null);
  readonly history = signal<AttendanceRecordDto[]>([]);

  readonly todayJalaliDate = signal<string>(this.persianDateService.getTodayFormatted());

  /** Today's record (open or completed) used for the status card. */
  readonly todayRecord = computed<AttendanceRecordDto | null>(() => {
    const today = toApiDate(new Date());
    const fromHistory = this.history().find(
      (record) => toApiDate(new Date(record.checkInTime)) === today
    );
    return fromHistory ?? this.currentRecord();
  });

  readonly isCheckedIn = computed(() => this.currentRecord() !== null);
  readonly isCheckedOut = computed(() => !!this.todayRecord()?.checkOutTime);
  readonly todayStatus = computed(() => getAttendanceStatusMeta(this.todayRecord()?.status));

  readonly checkInTime = computed(() => formatAttendanceTime(this.todayRecord()?.checkInTime));
  readonly checkOutTime = computed(() => formatAttendanceTime(this.todayRecord()?.checkOutTime));
  readonly workDuration = computed(() =>
    formatWorkDuration(this.todayRecord()?.checkInTime, this.todayRecord()?.checkOutTime)
  );

  /** Check-out is only possible while a check-in is open. */
  readonly nextActionLabel = computed(() => (this.isCheckedIn() ? 'ثبت خروج' : 'ثبت ورود'));

  readonly lastResultTitle = computed(() => {
    const action = this.lastResult()?.data?.attendanceAction;
    return action === 'CheckOut' ? 'خروج شما با موفقیت ثبت شد' : 'ورود شما با موفقیت ثبت شد';
  });

  readonly historyItems = computed(() =>
    this.history().map((record) => ({
      record,
      status: getAttendanceStatusMeta(record.status),
      checkIn: formatAttendanceTime(record.checkInTime),
      checkOut: formatAttendanceTime(record.checkOutTime),
    }))
  );

  private scannedQrToken: string | null = null;

  ngOnInit(): void {
    this.loadAttendance(true);
  }

  /** Reloads the open record and the recent history from the API. */
  loadAttendance(showLoading = false): void {
    if (showLoading) {
      this.viewState.set('loading');
      this.errorMessage.set(null);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - HISTORY_DAYS);

    this.attendanceService
      .getCurrentAttendance()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => this.currentRecord.set(record),
        error: () => this.currentRecord.set(null),
      });

    this.attendanceService
      .getMyAttendanceHistory({ startDate: toApiDate(startDate), endDate: toApiDate(endDate) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          this.history.set(records ?? []);
          if (showLoading) {
            this.viewState.set('ready');
          }
        },
        error: () => {
          this.history.set([]);
          if (showLoading) {
            this.viewState.set('ready');
          }
        },
      });
  }

  onStartScan(): void {
    this.errorMessage.set(null);
    this.lastResult.set(null);
    this.scannedQrToken = null;
    this.viewState.set('scanner');
  }

  onQrScanned(qrToken: string): void {
    if (!qrToken || this.viewState() === 'gettingLocation' || this.viewState() === 'submitting') {
      return;
    }

    this.scannedQrToken = qrToken;
    this.acquireLocationAndSubmit();
  }

  onScannerError(msg: string): void {
    this.errorMessage.set(msg);
    this.viewState.set('error');
  }

  onScannerCancel(): void {
    this.viewState.set('ready');
  }

  private acquireLocationAndSubmit(): void {
    if (!this.scannedQrToken) {
      return;
    }

    this.viewState.set('gettingLocation');

    if (!navigator.geolocation) {
      this.errorMessage.set('قابلیت موقعیت مکانی در مرورگر شما پشتیبانی نمی‌شود.');
      this.viewState.set('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.submitAttendance(position);
      },
      (error) => {
        let msg = 'دسترسی به موقعیت مکانی فعال نیست. برای ثبت حضور، دسترسی موقعیت مکانی را فعال کنید.';
        if (error.code === error.TIMEOUT) {
          msg = 'زمان دریافت موقعیت مکانی به پایان رسید. لطفاً دوباره تلاش کنید.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'موقعیت مکانی شما یافت نشد. لطفاً GPS گوشی خود را روشن کنید.';
        }
        this.errorMessage.set(msg);
        this.viewState.set('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  private submitAttendance(position: GeolocationPosition): void {
    if (!this.scannedQrToken || this.viewState() === 'submitting') {
      return;
    }

    this.viewState.set('submitting');

    // The backend requires both a GPS accuracy value and the reading timestamp,
    // and rejects stale or imprecise readings.
    const accuracy = Number(position.coords.accuracy);
    const request: ScanAttendanceRequestDto = {
      qrCodeToken: this.scannedQrToken,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      gpsAccuracyInMeters: Number.isFinite(accuracy) ? Math.round(accuracy * 10) / 10 : 0,
      locationTimestampUtc: new Date(
        Number.isFinite(position.timestamp) ? position.timestamp : Date.now()
      ).toISOString(),
      attendanceAction: this.isCheckedIn() ? 'CheckOut' : 'CheckIn',
      idempotencyKey: createIdempotencyKey(),
    };

    this.attendanceService
      .scanAttendance(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.lastResult.set(response);
          this.scannedQrToken = null;
          this.viewState.set('success');
          this.loadAttendance();
        },
        error: (error) => {
          // Refresh the status card without clearing the error message shown to the user.
          this.loadAttendance();
          this.errorMessage.set(resolveAttendanceErrorMessage(error));
          this.viewState.set('error');
        },
      });
  }

  onViewTodayStatus(): void {
    this.viewState.set('ready');
    this.loadAttendance();
  }

  onRetry(): void {
    this.loadAttendance(true);
  }

  onRefreshHistory(): void {
    this.loadAttendance();
  }
}

/** Replay-protection key; falls back for browsers without `crypto.randomUUID`. */
function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
