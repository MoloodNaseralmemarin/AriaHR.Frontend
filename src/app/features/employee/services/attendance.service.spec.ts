import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AttendanceService } from './attendance.service';
import {
  AttendanceScanResponseDto,
  ScanAttendanceRequestDto,
  TodayAttendanceDto,
} from '../models/employee-attendance.models';
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

  it('should request GET /api/attendance/current and map the record', () => {
    mockHttpClient.get.mockReturnValue(
      of({
        status: 200,
        body: {
          id: 'att-1',
          employeeId: 'emp-1',
          checkInTime: '2026-11-15T05:00:00Z',
          checkOutTime: null,
          status: 'Present',
          method: 'QRCode',
          workLocationId: 'wl-1',
        },
      })
    );

    const service = createService();
    let result: TodayAttendanceDto | null = null;
    service.getTodayAttendance().subscribe((res) => (result = res));

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/attendance/current`, {
      observe: 'response',
    });
    expect(result!.isCheckedIn).toBe(true);
    expect(result!.isCheckedOut).toBe(false);
    expect(result!.workLocationName).toBeNull();
    expect(result!.status).toBe('checkedIn');
    expect(result!.checkInTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should treat 204 No Content as not checked in', () => {
    mockHttpClient.get.mockReturnValue(of({ status: 204, body: null }));

    const service = createService();
    let result: TodayAttendanceDto | null = null;
    service.getTodayAttendance().subscribe((res) => (result = res));

    expect(result).toEqual({ isCheckedIn: false, isCheckedOut: false, status: 'notCheckedIn' });
  });

  it('should request POST /api/attendance/scan with the QR token payload', () => {
    const payload: ScanAttendanceRequestDto = {
      qrCodeToken: 'valid-qr-token',
      latitude: 35.6892,
      longitude: 51.389,
      gpsAccuracyInMeters: 8,
      locationTimestampUtc: '2026-11-15T05:32:00.000Z',
    };

    const mockResponse: AttendanceScanResponseDto = {
      success: true,
      code: 'OK',
      message: 'ثبت شد',
      data: {
        attendanceId: 'att-1',
        workLocationId: 'wl-1',
        workLocationName: 'بیمارستان سینا',
        attendanceAction: 'CheckIn',
        distanceInMeters: 12,
        allowedRadiusInMeters: 200,
        gpsAccuracyInMeters: 10,
        registeredAtUtc: '2026-11-15T05:32:00Z',
        attendanceStatus: 'Present',
        isLate: false,
        isEarlyDeparture: false,
        shiftName: null,
        isReplay: false,
      },
    };

    mockHttpClient.post.mockReturnValue(of(mockResponse));

    const service = createService();
    service.scanAttendance(payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.success).toBe(true);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/attendance/scan`,
      payload
    );
  });
});
