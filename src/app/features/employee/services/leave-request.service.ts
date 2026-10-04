import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateLeaveRequestDto,
  LeaveRequestDto,
  LeaveSummaryDto,
} from '../models/leave-request.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/attendance/leaves`;

  /**
   * Retrieves all leave requests for the authenticated employee.
   * Endpoint: GET /api/attendance/leaves
   */
  getLeaveRequests(): Observable<LeaveRequestDto[]> {
    return this.http.get<LeaveRequestDto[]>(this.apiUrl);
  }

  /**
   * Retrieves summary counts for the authenticated employee's leave requests.
   * Endpoint: GET /api/attendance/leaves/summary
   */
  getLeaveSummary(): Observable<LeaveSummaryDto> {
    return this.http.get<LeaveSummaryDto>(`${this.apiUrl}/summary`);
  }

  /**
   * Submits a new leave request.
   * Endpoint: POST /api/attendance/leaves
   */
  createLeaveRequest(dto: CreateLeaveRequestDto): Observable<LeaveRequestDto> {
    return this.http.post<LeaveRequestDto>(this.apiUrl, dto);
  }
}
