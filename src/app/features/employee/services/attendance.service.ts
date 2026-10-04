import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  RegisterAttendanceDto,
  RegisterAttendanceResponseDto,
  TodayAttendanceDto,
} from '../models/employee-attendance.models';

/**
 * Feature API service for Employee Attendance operations.
 *
 * Calls GET /api/attendance/today and POST /api/attendance/register per ARIAHR standards.
 */
@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/attendance`;

  /**
   * Retrieves today's attendance status and shift details for current employee.
   * GET /api/attendance/today
   */
  getTodayAttendance(): Observable<TodayAttendanceDto> {
    return this.http.get<TodayAttendanceDto>(`${this.apiUrl}/today`);
  }

  /**
   * Registers attendance (check-in or check-out) using scanned QR code and employee GPS coordinates.
   * POST /api/attendance/register
   */
  registerAttendance(payload: RegisterAttendanceDto): Observable<RegisterAttendanceResponseDto> {
    return this.http.post<RegisterAttendanceResponseDto>(`${this.apiUrl}/register`, payload);
  }
}
