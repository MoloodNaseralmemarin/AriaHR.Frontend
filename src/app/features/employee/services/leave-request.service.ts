import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  CreateLeaveRequestApiDto,
  CreateLeaveRequestDto,
  LeaveRequestDto,
  LeaveType,
  LeaveRequestStatus,
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
    return this.http.get<any>(this.myRequestsUrl).pipe(
      map((res) => {
        let items: any[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res && Array.isArray(res.items)) {
          items = res.items;
        } else if (res && Array.isArray(res.data)) {
          items = res.data;
        } else if (res && Array.isArray(res.value)) {
          items = res.value;
        }
        return items.map((item) => this.normalizeLeaveRequest(item));
      })
    );
  }

  /**
   * Submits a new leave request to the backend requests API.
   * Endpoint: POST /api/requests/leave
   */
  createLeaveRequest(dto: CreateLeaveRequestApiDto | CreateLeaveRequestDto): Observable<LeaveRequestDto> {
    return this.http.post<any>(this.submitApiUrl, dto).pipe(
      map((res) => this.normalizeLeaveRequest(res))
    );
  }

  /**
   * Helper to format raw time strings into HH:mm (removing seconds if present).
   */
  private formatTimeHHMM(timeStr?: string | null): string | undefined {
    if (!timeStr || !timeStr.trim()) return undefined;
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return timeStr;
  }

  /**
   * Safely normalizes raw API response objects to a standard LeaveRequestDto.
   */
  normalizeLeaveRequest(raw: any): LeaveRequestDto {
    if (!raw) {
      return {
        id: '',
        leaveType: 'daily',
        durationText: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    // Determine Leave Type ('daily' | 'hourly')
    const rawType = raw.leaveType ?? raw.LeaveType ?? raw.type ?? raw.Type;
    let leaveType: LeaveType = 'daily';
    if (rawType === 1 || rawType === '1' || String(rawType).toLowerCase() === 'hourly') {
      leaveType = 'hourly';
    } else if (rawType === 2 || rawType === '2' || String(rawType).toLowerCase() === 'daily') {
      leaveType = 'daily';
    }

    // Determine Status
    const rawStatus = raw.status ?? raw.Status;
    let status: LeaveRequestStatus = 'pending';
    if (typeof rawStatus === 'number') {
      switch (rawStatus) {
        case 1:
          status = 'approved';
          break;
        case 2:
          status = 'rejected';
          break;
        case 3:
          status = 'cancelled';
          break;
        default:
          status = 'pending';
          break;
      }
    } else if (typeof rawStatus === 'string') {
      const lowerStatus = rawStatus.toLowerCase();
      if (lowerStatus.includes('approved') || lowerStatus === 'töäyd' || lowerStatus.includes('تایید') || lowerStatus.includes('تأیید')) {
        status = 'approved';
      } else if (lowerStatus.includes('reject') || lowerStatus.includes('رد')) {
        status = 'rejected';
      } else if (lowerStatus.includes('cancel') || lowerStatus.includes('لغو')) {
        status = 'cancelled';
      } else {
        status = 'pending';
      }
    }

    // Parse Dates
    const startDate = raw.startDate ?? raw.StartDate ?? raw.start_date;
    const endDate = raw.endDate ?? raw.EndDate ?? raw.end_date;
    const date = raw.date ?? raw.Date ?? (leaveType === 'hourly' ? startDate : undefined);

    const startTimeRaw = raw.startTime ?? raw.StartTime ?? raw.start_time ?? undefined;
    const endTimeRaw = raw.endTime ?? raw.EndTime ?? raw.end_time ?? undefined;

    const startTime = this.formatTimeHHMM(startTimeRaw);
    const endTime = this.formatTimeHHMM(endTimeRaw);

    // Reason & Comments
    const reason = raw.reason ?? raw.Reason ?? raw.description ?? raw.Description ?? undefined;
    const managerComment = raw.managerComment ?? raw.ManagerComment ?? raw.managerNotes ?? raw.comment ?? undefined;
    const rejectionReason = raw.rejectionReason ?? raw.RejectionReason ?? raw.rejectionComment ?? undefined;
    const approverName = raw.approverName ?? raw.ApproverName ?? raw.managerName ?? raw.ManagerName ?? raw.approvedBy ?? undefined;
    const categoryName = raw.categoryName ?? raw.CategoryName ?? raw.leaveCategoryName ?? raw.LeaveCategoryName ?? raw.category?.name ?? undefined;
    const leaveCategoryId = raw.leaveCategoryId ?? raw.LeaveCategoryId ?? raw.categoryId ?? undefined;

    const createdAt = raw.createdAt ?? raw.CreatedAt ?? raw.createdAtUtc ?? raw.CreatedAtUtc ?? raw.createdDate ?? new Date().toISOString();
    const id = String(raw.id ?? raw.Id ?? raw.requestId ?? '');

    // Duration computation/text fallback
    let durationText = raw.durationText ?? raw.DurationText ?? raw.duration ?? raw.Duration ?? '';
    if (!durationText) {
      if (leaveType === 'daily') {
        if (startDate && endDate) {
          const d1 = new Date(startDate);
          const d2 = new Date(endDate);
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
            durationText = `${diffDays} روز`;
          }
        }
      } else if (leaveType === 'hourly' && startTime && endTime) {
        const [h1, m1] = startTime.split(':').map(Number);
        const [h2, m2] = endTime.split(':').map(Number);
        if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
          let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (totalMinutes < 0) totalMinutes += 24 * 60; // Overnight edge case
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          if (hours > 0 && mins > 0) {
            durationText = `${hours} ساعت و ${mins} دقیقه`;
          } else if (hours > 0) {
            durationText = `${hours} ساعت`;
          } else if (mins > 0) {
            durationText = `${mins} دقیقه`;
          }
        }
      }
    }

    return {
      id,
      leaveType,
      leaveCategoryId,
      categoryName,
      startDate,
      endDate,
      date,
      startTime,
      endTime,
      durationText,
      reason,
      status,
      createdAt,
      approverName,
      managerComment,
      rejectionReason,
    };
  }
}
