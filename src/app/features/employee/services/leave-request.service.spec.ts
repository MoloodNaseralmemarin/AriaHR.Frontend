import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto, LeaveRequestDto, LeaveSummaryDto } from '../models/leave-request.model';
import { environment } from '../../../../environments/environment';
import { of } from 'rxjs';

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;
  let httpClientMock: any;

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
      post: vi.fn(),
    };

    const injector = createEnvironmentInjector([
      { provide: HttpClient, useValue: httpClientMock },
      { provide: LeaveRequestService, useClass: LeaveRequestService },
    ], {} as EnvironmentInjector);

    runInInjectionContext(injector, () => {
      service = injector.get(LeaveRequestService);
    });
  });

  it('should get leave requests via GET /api/attendance/leaves', () => {
    const mockData: LeaveRequestDto[] = [
      {
        id: '1',
        leaveType: 'daily',
        startDate: '2025-02-10',
        endDate: '2025-02-12',
        durationText: '3 روز',
        status: 'pending',
        createdAt: '2025-02-09T10:00:00Z',
      },
    ];
    httpClientMock.get.mockReturnValue(of(mockData));

    service.getLeaveRequests().subscribe((res) => {
      expect(res).toEqual(mockData);
    });

    expect(httpClientMock.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/attendance/leaves`);
  });

  it('should get leave summary via GET /api/attendance/leaves/summary', () => {
    const mockSummary: LeaveSummaryDto = {
      pendingCount: 2,
      approvedCount: 5,
      rejectedCount: 1,
    };
    httpClientMock.get.mockReturnValue(of(mockSummary));

    service.getLeaveSummary().subscribe((res) => {
      expect(res).toEqual(mockSummary);
    });

    expect(httpClientMock.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/attendance/leaves/summary`);
  });

  it('should create a leave request via POST /api/attendance/leaves', () => {
    const dto: CreateLeaveRequestDto = {
      leaveType: 'hourly',
      date: '2025-02-15',
      startTime: '08:30',
      endTime: '12:30',
      reason: 'کارهای شخصی',
    };

    const mockResponse: LeaveRequestDto = {
      id: '2',
      leaveType: 'hourly',
      date: '2025-02-15',
      startTime: '08:30',
      endTime: '12:30',
      durationText: '4 ساعت',
      reason: 'کارهای شخصی',
      status: 'pending',
      createdAt: '2025-02-10T12:00:00Z',
    };
    httpClientMock.post.mockReturnValue(of(mockResponse));

    service.createLeaveRequest(dto).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(httpClientMock.post).toHaveBeenCalledWith(`${environment.apiUrl}/api/attendance/leaves`, dto);
  });
});
