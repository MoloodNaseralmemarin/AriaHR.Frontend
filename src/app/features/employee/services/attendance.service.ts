import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AttendanceRecordDto,
  AttendanceScanResponseDto,
  ScanAttendanceRequestDto,
  TodayAttendanceDto,
} from '../models/employee-attendance.models';

/**
 * Feature API service for Employee Attendance operations.
 *
 * Endpoints (backend `AttendanceController`):
 * - GET  /api/attendance/current  → 200 `AttendanceRecordDto` or 204 when nothing is registered today
 * - POST /api/attendance/scan     → `AttendanceScanResponse` envelope
 */
@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/attendance`;

  /**
   * Retrieves the authenticated employee's current attendance record.
   * GET /api/attendance/current (204 No Content means "not checked in yet").
   */
  getTodayAttendance(): Observable<TodayAttendanceDto> {
    return this.http
      .get<AttendanceRecordDto | null>(`${this.apiUrl}/current`, { observe: 'response' })
      .pipe(map((response) => this.toTodayViewModel(response)));
  }

  /**
   * Registers check-in/check-out from a scanned QR token plus the GPS reading.
   * POST /api/attendance/scan
   */
  scanAttendance(payload: ScanAttendanceRequestDto): Observable<AttendanceScanResponseDto> {
    return this.http.post<AttendanceScanResponseDto>(`${this.apiUrl}/scan`, payload);
  }

  private toTodayViewModel(response: HttpResponse<AttendanceRecordDto | null>): TodayAttendanceDto {
    if (response.status === 204 || !response.body) {
      return { isCheckedIn: false, isCheckedOut: false, status: 'notCheckedIn' };
    }

    const record = response.body;
    const checkInTime = this.formatTime(record.checkInTime);
    const checkOutTime = this.formatTime(record.checkOutTime);

    return {
      isCheckedIn: !!record.checkInTime,
      isCheckedOut: !!record.checkOutTime,
      checkInTime,
      checkOutTime,
      workDuration: this.formatDuration(record.checkInTime, record.checkOutTime),
      status: record.checkOutTime ? 'checkedOut' : 'checkedIn',
      workLocationName: null,
      shift: null,
    };
  }

  /** Converts a backend timestamp into a local HH:mm clock value. */
  formatTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatDuration(
    checkIn: string | null | undefined,
    checkOut: string | null | undefined
  ): string | null {
    if (!checkIn || !checkOut) {
      return null;
    }

    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) {
      return null;
    }

    const minutes = Math.floor((end - start) / 60000);
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (hours > 0 && remaining > 0) {
      return `${hours} ساعت و ${remaining} دقیقه`;
    }
    if (hours > 0) {
      return `${hours} ساعت`;
    }
    return `${remaining} دقیقه`;
  }
}
