import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AttendanceService } from './attendance.service';
import {
  AttendanceRecordDto,
  AttendanceScanResponseDto,
  ScanAttendanceRequestDto,
} from '../models/employee-attendance.models';
import { environment } from '../../../../environments/environment';

describe('AttendanceService (Isolated Unit Tests)', () => {
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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

  it('should POST the scan payload to /api/attendance/scan', () => {
    const payload: ScanAttendanceRequestDto = {
      qrCodeToken: 'valid-qr-token',
      latitude: 35.6892,
      longitude: 51.389,
      gpsAccuracyInMeters: 12.5,
      locationTimestampUtc: '2026-11-16T08:30:00.000Z',
      attendanceAction: 'CheckIn',
      idempotencyKey: 'key-1',
    };

    const response: AttendanceScanResponseDto = {
      success: true,
      code: 'ATTENDANCE_REGISTERED',
      message: 'حضور شما با موفقیت ثبت شد',
      data: { attendanceAction: 'CheckIn', isReplay: false },
    };

    mockHttpClient.post.mockReturnValue(of(response));

    const service = createService();
    service.scanAttendance(payload).subscribe((res) => {
      expect(res).toEqual(response);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/attendance/scan`,
      payload
    );
  });

  it('should request GET /api/attendance/current', () => {
    const record: AttendanceRecordDto = {
      id: 'att-1',
      organizationId: 'org-1',
      employeeId: 'emp-1',
      checkInTime: '2026-11-16T08:30:00Z',
      method: 'QRCode',
      status: 'Present',
      isWithinGeofence: true,
      createdAtUtc: '2026-11-16T08:30:00Z',
    };

    mockHttpClient.get.mockReturnValue(of(record));

    const service = createService();
    service.getCurrentAttendance().subscribe((res) => {
      expect(res).toEqual(record);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/attendance/current`);
  });

  it('should map a 204 no-content response to null', () => {
    mockHttpClient.get.mockReturnValue(of(null));

    const service = createService();
    service.getCurrentAttendance().subscribe((res) => {
      expect(res).toBeNull();
    });
  });

  it('should send startDate/endDate query params to /api/attendance/my', () => {
    mockHttpClient.get.mockReturnValue(of([]));

    const service = createService();
    service
      .getMyAttendanceHistory({ startDate: '2026-11-01', endDate: '2026-11-16' })
      .subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe(`${environment.apiUrl}/api/attendance/my`);
    expect(options.params.get('startDate')).toBe('2026-11-01');
    expect(options.params.get('endDate')).toBe('2026-11-16');
  });

  it('should send organizationId and date range to GET /api/attendance', () => {
    mockHttpClient.get.mockReturnValue(of([]));

    const service = createService();
    service
      .getOrganizationAttendance({
        organizationId: 'org-1',
        startDate: '2026-11-16',
        endDate: '2026-11-16',
      })
      .subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe(`${environment.apiUrl}/api/attendance`);
    expect(options.params.get('organizationId')).toBe('org-1');
    expect(options.params.get('startDate')).toBe('2026-11-16');
  });

  it('should PATCH the record status', () => {
    const record = {
      id: 'att-1',
      organizationId: 'org-1',
      employeeId: 'emp-1',
      checkInTime: '2026-11-16T08:30:00Z',
      method: 'QRCode',
      status: 'Approved',
      isWithinGeofence: true,
      createdAtUtc: '2026-11-16T08:30:00Z',
    } as AttendanceRecordDto;

    mockHttpClient.patch.mockReturnValue(of(record));

    const service = createService();
    service.updateAttendanceStatus('att-1', { status: 'Approved' }).subscribe((res) => {
      expect(res.status).toBe('Approved');
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/attendance/att-1/status`,
      { status: 'Approved' }
    );
  });
});
