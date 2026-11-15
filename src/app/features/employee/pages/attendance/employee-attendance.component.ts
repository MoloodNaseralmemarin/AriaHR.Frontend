import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PersianDateService } from '../../../../core/services/persian-date.service';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { AttendanceService } from '../../services/attendance.service';
import {
  AttendanceScanDataDto,
  AttendanceScanResponseDto,
  TodayAttendanceDto,
} from '../../models/employee-attendance.models';
import { QrScannerComponent } from '../../components/qr-scanner/qr-scanner.component';

export type AttendanceViewState =
  | 'loading'
  | 'ready'
  | 'scanner'
  | 'gettingLocation'
  | 'submitting'
  | 'success'
  | 'error';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [CommonModule, PersianDigitsPipe, QrScannerComponent],
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendanceComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly persianDateService = inject(PersianDateService);

  readonly viewState = signal<AttendanceViewState>('loading');
  readonly todayAttendance = signal<TodayAttendanceDto | null>(null);

  readonly todayJalaliDate = signal<string>(this.persianDateService.getTodayFormatted());

  readonly errorMessage = signal<string | null>(null);

  readonly lastResult = signal<AttendanceScanResponseDto | null>(null);
  readonly lastScanData = signal<AttendanceScanDataDto | null>(null);

  readonly isAttendanceBlocked = computed(() => {
    return !!this.todayAttendance()?.isAttendanceBlockedByLeave;
  });

  readonly leaveRestrictionMessage = computed(() => {
    const customMsg = this.todayAttendance()?.leaveRestrictionMessage;
    if (customMsg) return customMsg;
    return 'امکان ثبت حضور و غیاب در زمان مرخصی وجود ندارد.';
  });

  private scannedQrCode: string | null = null;

  ngOnInit(): void {
    this.loadTodayAttendance();
  }

  loadTodayAttendance(): void {
    this.viewState.set('loading');
    this.errorMessage.set(null);

    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => {
        this.todayAttendance.set(data);
        this.viewState.set('ready');
      },
      error: (err) => {
        // Do not pretend the employee has no attendance: keep the screen usable
        // but surface that the current status could not be loaded.
        this.errorMessage.set(
          this.readErrorMessage(err, 'دریافت وضعیت حضور امروز با خطا مواجه شد.')
        );
        this.todayAttendance.set(null);
        this.viewState.set('ready');
      },
    });
  }

  onStartScan(): void {
    this.errorMessage.set(null);
    this.scannedQrCode = null;
    this.viewState.set('scanner');
  }

  onQrScanned(qrCode: string): void {
    this.scannedQrCode = qrCode;
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
    if (!this.scannedQrCode) return;

    this.viewState.set('gettingLocation');

    if (!navigator.geolocation) {
      this.errorMessage.set('قابلیت موقعیت مکانی در مرورگر شما پشتیبانی نمی‌شود.');
      this.viewState.set('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        this.submitAttendance(latitude, longitude, accuracy, position.timestamp);
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
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  private submitAttendance(
    latitude: number,
    longitude: number,
    accuracy: number | null,
    locationTimestampMs: number
  ): void {
    if (!this.scannedQrCode) return;

    this.viewState.set('submitting');

    this.attendanceService
      .scanAttendance({
        qrCodeToken: this.scannedQrCode,
        latitude,
        longitude,
        gpsAccuracyInMeters: Number.isFinite(accuracy) ? accuracy : null,
        locationTimestampUtc: new Date(locationTimestampMs).toISOString(),
        idempotencyKey: this.createIdempotencyKey(),
        deviceInfo:
          typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 256) : undefined,
      })
      .subscribe({
        next: (res) => {
          this.lastResult.set(res);

          if (!res.success) {
            this.errorMessage.set(res.message || 'ثبت حضور و غیاب انجام نشد.');
            this.viewState.set('error');
            return;
          }

          this.lastScanData.set(res.data);
          this.applyScanResult(res.data);
          this.viewState.set('success');

          // The record is authoritative on the server; refresh it after registering.
          this.attendanceService.getTodayAttendance().subscribe({
            next: (today) => {
              this.todayAttendance.set({
                ...today,
                workLocationName: res.data?.workLocationName ?? today.workLocationName,
              });
            },
            error: () => {
              // The scan already succeeded; the local state above is enough.
            },
          });
        },
        error: (err) => {
          this.handleApiError(err);
          this.viewState.set('error');
        },
      });
  }

  /** Updates the visible card from the scan response, without inventing data. */
  private applyScanResult(data: AttendanceScanDataDto | null): void {
    if (!data) {
      return;
    }

    const current = this.todayAttendance() ?? { isCheckedIn: false, isCheckedOut: false };
    const registeredTime = this.attendanceService.formatTime(data.registeredAtUtc);
    const isCheckOut = (data.attendanceAction ?? '').toLowerCase() === 'checkout';

    this.todayAttendance.set({
      ...current,
      isCheckedIn: true,
      isCheckedOut: current.isCheckedOut || isCheckOut,
      checkInTime: isCheckOut ? current.checkInTime : (registeredTime ?? current.checkInTime),
      checkOutTime: isCheckOut ? registeredTime : current.checkOutTime,
      workLocationName: data.workLocationName ?? current.workLocationName,
      shift: data.shiftName
        ? { name: data.shiftName, startTime: '', endTime: '' }
        : current.shift,
    });
  }

  private createIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private readErrorMessage(err: unknown, fallback: string): string {
    const body = (err as { error?: { message?: string; detail?: string; title?: string } } | null)
      ?.error;
    return body?.message || body?.detail || body?.title || fallback;
  }

  private handleApiError(err: unknown): void {
    const httpErr = err as
      | {
          status?: number;
          error?: {
            code?: string;
            message?: string;
            detail?: string;
            title?: string;
          };
        }
      | null;

    const status = httpErr?.status;
    const body = httpErr?.error;
    const errorCode = body?.code ?? '';
    const backendMsg = body?.message || body?.detail || body?.title || '';

    if (!status) {
      this.errorMessage.set('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.');
      return;
    }

    if (status === 401 || status === 403) {
      this.errorMessage.set('دسترسی غیرمجاز. لطفاً مجدداً وارد حساب کاربری خود شوید.');
      return;
    }

    const messages: Record<string, string> = {
      QR_CODE_INVALID: 'QR معتبر نیست. لطفاً QR محل کار را دوباره اسکن کنید.',
      QR_CODE_EXPIRED: 'QR منقضی شده است. لطفاً QR جدید محل کار را اسکن کنید.',
      QR_CODE_DISABLED: 'QR Code این محل کار غیرفعال است. با مدیر مرکز تماس بگیرید.',
      WORK_LOCATION_NOT_FOUND: 'محل کار این QR یافت نشد.',
      WORK_LOCATION_INACTIVE: 'این محل کار غیرفعال است و ثبت تردد در آن امکان‌پذیر نیست.',
      EMPLOYEE_NOT_FOUND: 'پروندهٔ کارمند شما یافت نشد. با مدیر مرکز تماس بگیرید.',
      EMPLOYEE_NOT_AUTHORIZED: 'اجازهٔ ثبت تردد برای شما وجود ندارد.',
      LOCATION_UNAVAILABLE: 'موقعیت مکانی در دسترس نیست. GPS دستگاه را بررسی کنید.',
      LOCATION_COORDINATES_INVALID: 'مختصات موقعیت مکانی نامعتبر است.',
      LOCATION_ACCURACY_INSUFFICIENT:
        'دقت موقعیت مکانی کافی نیست. تا دریافت سیگنال بهتر GPS صبر کنید و دوباره تلاش کنید.',
      LOCATION_DATA_EXPIRED: 'اطلاعات موقعیت مکانی قدیمی است. لطفاً دوباره تلاش کنید.',
      LOCATION_TIMESTAMP_INVALID: 'زمان موقعیت مکانی نامعتبر است. دوباره تلاش کنید.',
      OUTSIDE_ALLOWED_RADIUS:
        'شما در محدودهٔ مجاز محل کار نیستید. حضور در محل کار و تلاش مجدد لازم است.',
      SHIFT_VALIDATION_FAILED: 'ثبت تردد با قوانین شیفت شما سازگار نیست.',
      DUPLICATE_ATTENDANCE: 'تردد امروز شما قبلاً ثبت شده است.',
      INVALID_ATTENDANCE_ACTION: 'نوع عملیات تردد نامعتبر است.',
      IDEMPOTENCY_KEY_REUSED: 'این درخواست قبلاً پردازش شده است.',
    };

    const mapped = messages[errorCode];
    this.errorMessage.set(mapped || backendMsg || 'ثبت حضور و غیاب با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
  }

  onViewTodayStatus(): void {
    this.viewState.set('ready');
  }

  onRetry(): void {
    this.viewState.set('ready');
  }
}
