import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CenterManagerDashboardService } from './center-manager-dashboard.service';
import { CenterManagerDashboardDto } from '../models/center-manager-dashboard.dto';

describe('CenterManagerDashboardService (isolated)', () => {
  let service: CenterManagerDashboardService;
  let httpClientMock: any;

  const mockResponse: CenterManagerDashboardDto = {
    activeEmployeesCount: 15,
    presentTodayCount: 12,
    absentTodayCount: 1,
    approvedLeaveTodayCount: 2,
    lateArrivalsTodayCount: 0,
    pendingLeaveRequestsCount: 3,
    pendingAttendanceCorrectionRequestsCount: 0,
    unapprovedShiftsCount: 0,
  };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: httpClientMock },
        { provide: CenterManagerDashboardService, useClass: CenterManagerDashboardService },
      ],
    });

    service = injector.get(CenterManagerDashboardService);
  });

  it('should call GET /api/center-manager/dashboard and return metrics DTO', () => {
    httpClientMock.get.mockReturnValue(of(mockResponse));

    service.getDashboardMetrics().subscribe((data) => {
      expect(data).toEqual(mockResponse);
    });

    expect(httpClientMock.get).toHaveBeenCalledWith('/api/center-manager/dashboard');
  });

  it('should handle API errors gracefully', () => {
    const errorResponse = new Error('Server error');
    httpClientMock.get.mockReturnValue(throwError(() => errorResponse));

    service.getDashboardMetrics().subscribe({
      next: () => {
        throw new Error('Should not succeed');
      },
      error: (err) => {
        expect(err).toBe(errorResponse);
      },
    });
  });
});
