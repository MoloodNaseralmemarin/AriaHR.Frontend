import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PersianDateService } from '../../../../core/services/persian-date.service';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { AttendanceService } from '../../services/attendance.service';
import { TodayAttendanceDto, RegisterAttendanceResponseDto } from '../../models/employee-attendance.models';
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

  readonly lastResult = signal<RegisterAttendanceResponseDto | null>(null);

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
        // Handle initial load error gracefully
        this.todayAttendance.set({
          isCheckedIn: false,
          isCheckedOut: false,
        });
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
        const { latitude, longitude } = position.coords;
        this.submitAttendance(latitude, longitude);
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

  private submitAttendance(latitude: number, longitude: number): void {
    if (!this.scannedQrCode) return;

    this.viewState.set('submitting');

    this.attendanceService
      .registerAttendance({
        qrCode: this.scannedQrCode,
        latitude,
        longitude,
      })
      .subscribe({
        next: (res) => {
          this.lastResult.set(res);

          // Update local attendance state immediately if provided
          const current = this.todayAttendance() || {
            isCheckedIn: false,
            isCheckedOut: false,
          };

          const isCheckOut = res.operationType === 'checkOut' || current.isCheckedIn;

          this.todayAttendance.set({
            ...current,
            isCheckedIn: isCheckOut ? true : true,
            isCheckedOut: isCheckOut ? true : false,
            checkInTime: res.checkInTime || current.checkInTime,
            checkOutTime: res.checkOutTime || current.checkOutTime,
            workLocationName: res.workLocationName || current.workLocationName,
          });

          this.viewState.set('success');
        },
        error: (err) => {
          this.handleApiError(err);
          this.viewState.set('error');
        },
      });
  }

  private handleApiError(err: unknown): void {
    let message = 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.';

    if (err && typeof err === 'object') {
      const httpErr = err as { status?: number; error?: { message?: string; code?: string } };
      const status = httpErr.status;
      const backendMsg = httpErr.error?.message || '';

      if (status === 400 || status === 422) {
        if (backendMsg.includes('expired') || backendMsg.includes('منقضی')) {
          message = 'QR منقضی شده است. لطفاً QR جدید محل کار را اسکن کنید.';
        } else if (backendMsg.includes('outside') || backendMsg.includes('محدوده')) {
          message = 'شما در محدوده محل کار نیستید. لطفاً در محل کار حضور داشته باشید و دوباره تلاش کنید.';
        } else if (backendMsg.includes('invalid') || backendMsg.includes('نامعتبر')) {
          message = 'QR معتبر نیست. لطفاً QR محل کار را دوباره اسکن کنید.';
        } else if (backendMsg) {
          message = backendMsg;
        } else {
          message = 'کد QR یا موقعیت مکانی معتبر نیست. لطفاً مجدداً تلاش کنید.';
        }
      } else if (status === 401 || status === 403) {
        message = 'دسترسی غیرمجاز. لطفاً مجدداً وارد حساب کاربری خود شوید.';
      } else if (status === 404) {
        message = 'محل کار یا کد QR یافت نشد.';
      }
    }

    this.errorMessage.set(message);
  }

  onViewTodayStatus(): void {
    this.viewState.set('ready');
  }

  onRetry(): void {
    this.viewState.set('ready');
  }
}
