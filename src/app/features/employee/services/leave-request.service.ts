import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateLeaveRequestApiDto,
  CreateLeaveRequestDto,
  LeaveRequestDto,
} from '../models/leave-request.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveRequestService {
  private readonly http = inject(HttpClient);
  private readonly myRequestsUrl = `${environment.apiUrl}/api/requests/my`;
  private readonly submitApiUrl = `${environment.apiUrl}/api/requests/leave`;

  /**
   * Retrieves all leave requests for the authenticated employee.
   * Endpoint: GET /api/requests/my
   */
  getLeaveRequests(): Observable<LeaveRequestDto[]> {
    return this.http.get<LeaveRequestDto[]>(this.myRequestsUrl);
  }

  /**
   * Submits a new leave request to the backend requests API.
   * Endpoint: POST /api/requests/leave
   */
  createLeaveRequest(dto: CreateLeaveRequestApiDto | CreateLeaveRequestDto): Observable<LeaveRequestDto> {
    return this.http.post<LeaveRequestDto>(this.submitApiUrl, dto);
  }
}
