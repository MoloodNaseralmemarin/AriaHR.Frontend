import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EmployeeAttendanceComponent } from './employee-attendance.component';
import { AttendanceService } from '../../services/attendance.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import {
  AttendanceRecordDto,
  AttendanceScanResponseDto,
} from '../../models/employee-attendance.models';

describe('EmployeeAttendanceComponent (Isolated Unit Tests)', () => {
  let component: EmployeeAttendanceComponent;
  let mockAttendanceService: {
    getCurrentAttendance: ReturnType<typeof vi.fn>;
    getMyAttendanceHistory: ReturnType<typeof vi.fn>;
    scanAttendance: ReturnType<typeof vi.fn>;
  };
  let mockPersianDateService: {
    getTodayFormatted: ReturnType<typeof vi.fn>;
  };

  const openRecord: AttendanceRecordDto = {
    id: 'att-1',
    organizationId: 'org-1',
    employeeId: 'emp-1',
    checkInTime: new Date().toISOString(),
    method: 'QRCode',
    status: 'Present',
    isWithinGeofence: true,
    createdAtUtc: new Date().toISOString(),
  };

  function createComponent(): EmployeeAttendanceComponent {
    const injector = Injector.create({
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: PersianDateService, useValue: mockPersianDateService },
        {
          provide: DestroyRef,
          useValue: { onDestroy: () => () => undefined } as unknown as DestroyRef,
        },
      ],
    });

    let comp!: EmployeeAttendanceComponent;
    runInInjectionContext(injector, () => {
      comp = new EmployeeAttendanceComponent();
    });
    return comp;
  }

  beforeEach(() => {
    mockAttendanceService = {
      getCurrentAttendance: vi.fn().mockReturnValue(of(null)),
      getMyAttendanceHistory: vi.fn().mockReturnValue(of([])),
      scanAttendance: vi.fn(),
    };

    mockPersianDateService = {
      getTodayFormatted: vi.fn().mockReturnValue('چهارشنبه، ۲۳ مهر ۱۴۰۵'),
    };

    component = createComponent();
  });

  it('should load the current record and history on init', () => {
    mockAttendanceService.getCurrentAttendance.mockReturnValue(of(openRecord));
    mockAttendanceService.getMyAttendanceHistory.mockReturnValue(of([openRecord]));

    component.ngOnInit();

    expect(mockAttendanceService.getCurrentAttendance).toHaveBeenCalled();
    expect(mockAttendanceService.getMyAttendanceHistory).toHaveBeenCalled();
    expect(component.currentRecord()).toEqual(openRecord);
    expect(component.isCheckedIn()).toBe(true);
    expect(component.viewState()).toBe('ready');
  });

  it('should expose check-out as the next action while a check-in is open', () => {
    mockAttendanceService.getCurrentAttendance.mockReturnValue(of(openRecord));

    component.ngOnInit();

    expect(component.nextActionLabel()).toBe('ثبت خروج');
  });

  it('should set state to scanner on onStartScan', () => {
    component.onStartScan();

    expect(component.viewState()).toBe('scanner');
    expect(component.errorMessage()).toBeNull();
  });

  it('should handle scanner error and set error state', () => {
    component.onScannerError('دسترسی به دوربین فعال نیست.');

    expect(component.viewState()).toBe('error');
    expect(component.errorMessage()).toBe('دسترسی به دوربین فعال نیست.');
  });

  it('should reset state to ready on onScannerCancel', () => {
    component.onStartScan();
    component.onScannerCancel();

    expect(component.viewState()).toBe('ready');
  });

  it('should set error state when geolocation is denied', () => {
    component.onQrScanned('sample-qr-token');

    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({ code: 1, PERMISSION_DENIED: 1 });
      }),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    component.onQrScanned('sample-qr-token');

    expect(component.viewState()).toBe('error');
    expect(component.errorMessage()).toContain('دسترسی به موقعیت مکانی فعال نیست');
  });

  it('should submit the scan with GPS accuracy, timestamp and action', () => {
    const response: AttendanceScanResponseDto = {
      success: true,
      code: 'ATTENDANCE_REGISTERED',
      message: 'حضور شما با موفقیت ثبت شد',
      data: {
        attendanceAction: 'CheckIn',
        workLocationName: 'بیمارستان سینا',
        isReplay: false,
      },
    };

    mockAttendanceService.scanAttendance.mockReturnValue(of(response));

    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 35.6892, longitude: 51.389, accuracy: 12.34 },
          timestamp: 1763281800000,
        });
      }),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    component.onStartScan();
    component.onQrScanned('sample-qr-token');

    expect(component.viewState()).toBe('confirming');

    component.onConfirmAttendance();

    expect(mockAttendanceService.scanAttendance).toHaveBeenCalledTimes(1);

    const payload = mockAttendanceService.scanAttendance.mock.calls[0][0];
    expect(payload.qrCodeToken).toBe('sample-qr-token');
    expect(payload.latitude).toBe(35.6892);
    expect(payload.longitude).toBe(51.389);
    expect(payload.gpsAccuracyInMeters).toBe(12.3);
    expect(payload.locationTimestampUtc).toBe(new Date(1763281800000).toISOString());
    expect(payload.attendanceAction).toBe('CheckIn');
    expect(typeof payload.idempotencyKey).toBe('string');

    expect(component.viewState()).toBe('success');
    expect(component.lastResult()).toEqual(response);
  });

  it('should map the QR_CODE_EXPIRED backend code to a Persian message', () => {
    mockAttendanceService.scanAttendance.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: {
          success: false,
          code: 'QR_CODE_EXPIRED',
          message: 'QR token expired',
        },
      }))
    );

    (component as unknown as { scannedQrToken: string | null }).scannedQrToken = 'qr-token';
    component.onStartScan();
    (component as unknown as { scannedQrToken: string | null }).scannedQrToken = 'qr-token';
    (component as unknown as { submitAttendance: (p: unknown) => void }).submitAttendance({
      coords: { latitude: 35.6, longitude: 51.3, accuracy: 10 },
      timestamp: Date.now(),
    });

    expect(component.viewState()).toBe('error');
    expect(component.errorMessage()).toBe(
      'کد QR منقضی شده است. لطفاً کد جدید محل کار را اسکن کنید.'
    );
  });

  it('should enter confirming state after a valid scan and location', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({ coords: { latitude: 35.6, longitude: 51.3, accuracy: 10 }, timestamp: Date.now() });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', { value: mockGeolocation, configurable: true, writable: true });

    component.onStartScan();
    component.onQrScanned('qr-token');

    expect(component.viewState()).toBe('confirming');
    expect(mockAttendanceService.scanAttendance).not.toHaveBeenCalled();
  });

  it('should cancel confirmation and return to ready', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({ coords: { latitude: 35.6, longitude: 51.3, accuracy: 10 }, timestamp: Date.now() });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', { value: mockGeolocation, configurable: true, writable: true });

    component.onStartScan();
    component.onQrScanned('qr-token');
    component.onCancelConfirmation();

    expect(component.viewState()).toBe('ready');
    expect(component.pendingPosition).toBeNull();
  });

  it('should reject invalid QR token', () => {
    component.onStartScan();
    component.onQrScanned('   ');

    expect(component.viewState()).not.toBe('confirming');
  });

  it('should prevent duplicate submission when confirming', () => {
    const response: AttendanceScanResponseDto = {
      success: true,
      code: 'ATTENDANCE_REGISTERED',
      message: 'ok',
      data: { attendanceAction: 'CheckIn', isReplay: false },
    };
    mockAttendanceService.scanAttendance.mockReturnValue(of(response));

    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({ coords: { latitude: 35.6, longitude: 51.3, accuracy: 10 }, timestamp: Date.now() });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', { value: mockGeolocation, configurable: true, writable: true });

    component.onStartScan();
    component.onQrScanned('qr-token');
    component.onConfirmAttendance();
    component.onConfirmAttendance();

    expect(mockAttendanceService.scanAttendance).toHaveBeenCalledTimes(1);
  });

  it('should show the approved-leave restriction message', () => {
    mockAttendanceService.scanAttendance.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: {
          title: 'خطای مرخصی',
          detail: 'امکان ثبت تردد در بازه مرخصی تأییدشده وجود ندارد.',
          errorCode: 'ATTENDANCE_BLOCKED_BY_APPROVED_LEAVE',
        },
      }))
    );

    component.onStartScan();
    (component as unknown as { scannedQrToken: string | null }).scannedQrToken = 'qr-token';
    (component as unknown as { submitAttendance: (p: unknown) => void }).submitAttendance({
      coords: { latitude: 35.6, longitude: 51.3, accuracy: 10 },
      timestamp: Date.now(),
    });

    expect(component.viewState()).toBe('error');
    expect(component.errorMessage()).toBe('امکان ثبت تردد در بازه مرخصی تأییدشده وجود ندارد.');
  });
});
