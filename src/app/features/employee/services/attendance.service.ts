import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AttendanceDateRangeQuery,
  AttendanceRecordDto,
  AttendanceScanResponseDto,
  CheckInRequestDto,
  CheckOutRequestDto,
  OrganizationAttendanceQuery,
  ScanAttendanceRequestDto,
  UpdateAttendanceStatusRequestDto,
} from '../models/employee-attendance.models';

/**
 * Feature API service for the Attendance module.
 *
 * Mirrors `AttendanceController` (`/api/attendance`):
 * POST /scan, POST /check-in, POST /check-out, GET /current, GET /my,
 * GET / (organization attendance), PATCH /{id}/status.
 */
@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/attendance`;

  /**
   * Registers check-in/check-out from a work-location QR token plus a GPS reading.
   * POST /api/attendance/scan
   */
  scanAttendance(request: ScanAttendanceRequestDto): Observable<AttendanceScanResponseDto> {
    return this.http.post<AttendanceScanResponseDto>(`${this.apiUrl}/scan`, request);
  }

  /**
   * Legacy GPS/QR check-in; returns the created record.
   * POST /api/attendance/check-in
   */
  checkIn(request: CheckInRequestDto): Observable<AttendanceRecordDto> {
    return this.http.post<AttendanceRecordDto>(`${this.apiUrl}/check-in`, request);
  }

  /**
   * Closes the active attendance record.
   * POST /api/attendance/check-out
   */
  checkOut(request: CheckOutRequestDto = {}): Observable<AttendanceRecordDto> {
    return this.http.post<AttendanceRecordDto>(`${this.apiUrl}/check-out`, request);
  }

  /**
   * Current open attendance record of the authenticated employee.
   * GET /api/attendance/current — the API answers 204 No Content when there is none.
   */
  getCurrentAttendance(): Observable<AttendanceRecordDto | null> {
    return this.http.get<AttendanceRecordDto | null>(`${this.apiUrl}/current`);
  }

  /**
   * Attendance history of the authenticated employee.
   * GET /api/attendance/my?startDate=&endDate=
   */
  getMyAttendanceHistory(query: AttendanceDateRangeQuery = {}): Observable<AttendanceRecordDto[]> {
    return this.http.get<AttendanceRecordDto[]>(`${this.apiUrl}/my`, {
      params: buildDateRangeParams(query),
    });
  }

  /**
   * Organization attendance report (CenterManager / SystemAdmin).
   * GET /api/attendance?organizationId=&startDate=&endDate=&employeeId=
   */
  getOrganizationAttendance(
    query: OrganizationAttendanceQuery = {}
  ): Observable<AttendanceRecordDto[]> {
    let params = buildDateRangeParams(query);

    if (query.organizationId) {
      params = params.set('organizationId', query.organizationId);
    }
    if (query.employeeId) {
      params = params.set('employeeId', query.employeeId);
    }

    return this.http.get<AttendanceRecordDto[]>(this.apiUrl, { params });
  }

  /**
   * Corrects the status of an attendance record.
   * PATCH /api/attendance/{id}/status
   */
  updateAttendanceStatus(
    id: string,
    request: UpdateAttendanceStatusRequestDto
  ): Observable<AttendanceRecordDto> {
    return this.http.patch<AttendanceRecordDto>(`${this.apiUrl}/${id}/status`, request);
  }
}

function buildDateRangeParams(query: AttendanceDateRangeQuery): HttpParams {
  let params = new HttpParams();

  if (query.startDate) {
    params = params.set('startDate', query.startDate);
  }
  if (query.endDate) {
    params = params.set('endDate', query.endDate);
  }

  return params;
}
