import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AttendanceService } from './attendance.service';
import { TodayAttendanceDto, RegisterAttendanceResponseDto } from '../models/employee-attendance.models';
import { environment } from '../../../../environments/environment';

describe('AttendanceService (Isolated Unit Tests)', () => {
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
  };

  function createService(): AttendanceService {
    const injector = Injector.create({
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    });

    let service!: AttendanceService;
    runInInjectionContext(injector, () => {
      service = new AttendanceService();
    });
    return service;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should request GET /api/attendance/today', () => {
    const mockData: TodayAttendanceDto = {
      isCheckedIn: true,
      isCheckedOut: false,
      checkInTime: '08:30',
      workLocationName: 'بیمارستان سینا',
      shift: {
        name: 'شیفت روز',
        startTime: '08:00',
        endTime: '16:00',
      },
    };

    mockHttpClient.get.mockReturnValue(of(mockData));

    const service = createService();
    service.getTodayAttendance().subscribe((res) => {
      expect(res).toEqual(mockData);
      expect(res.isCheckedIn).toBe(true);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/attendance/today`);
  });

  it('should request POST /api/attendance/register', () => {
    const payload = {
      qrCode: 'valid-qr-token',
      latitude: 35.6892,
      longitude: 51.389,
    };

    const mockResponse: RegisterAttendanceResponseDto = {
      success: true,
      operationType: 'checkIn',
      checkInTime: '08:32',
      workLocationName: 'بیمارستان سینا',
    };

    mockHttpClient.post.mockReturnValue(of(mockResponse));

    const service = createService();
    service.registerAttendance(payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.success).toBe(true);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/attendance/register`,
      payload
    );
  });
});
