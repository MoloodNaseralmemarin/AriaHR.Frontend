import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestDto } from '../models/leave-request.model';
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

  it('should get authenticated employee leave requests via GET /api/requests/my', () => {
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

    expect(httpClientMock.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/requests/my`);
  });

  it('should create a daily leave request via POST /api/requests/leave', () => {
    const dto = {
      leaveType: 1,
      leaveCategoryId: 'cat-1',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      startTime: null,
      endTime: null,
      reason: 'استراحت',
    };

    const mockResponse: LeaveRequestDto = {
      id: '1',
      leaveType: 'daily',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      durationText: '3 روز',
      reason: 'استراحت',
      status: 'pending',
      createdAt: '2025-02-09T10:00:00Z',
    };
    httpClientMock.post.mockReturnValue(of(mockResponse));

    service.createLeaveRequest(dto).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(httpClientMock.post).toHaveBeenCalledWith(`${environment.apiUrl}/api/requests/leave`, dto);
  });

  it('should create an hourly leave request via POST /api/requests/leave', () => {
    const dto = {
      leaveType: 2,
      leaveCategoryId: 'cat-2',
      startDate: '2025-02-15',
      endDate: '2025-02-15',
      startTime: '08:30',
      endTime: '12:30',
      reason: 'کارهای شخصی',
    };

    const mockResponse: LeaveRequestDto = {
      id: '2',
      leaveType: 'hourly',
      startDate: '2025-02-15',
      endDate: '2025-02-15',
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

    expect(httpClientMock.post).toHaveBeenCalledWith(`${environment.apiUrl}/api/requests/leave`, dto);
  });
});
