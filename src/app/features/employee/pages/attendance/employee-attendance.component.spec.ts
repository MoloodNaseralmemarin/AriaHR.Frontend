import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EmployeeAttendanceComponent } from './employee-attendance.component';
import { AttendanceService } from '../../services/attendance.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { TodayAttendanceDto, RegisterAttendanceResponseDto } from '../../models/employee-attendance.models';

describe('EmployeeAttendanceComponent (Isolated Unit Tests)', () => {
  let component: EmployeeAttendanceComponent;
  let mockAttendanceService: {
    getTodayAttendance: ReturnType<typeof vi.fn>;
    registerAttendance: ReturnType<typeof vi.fn>;
  };
  let mockPersianDateService: {
    getTodayFormatted: ReturnType<typeof vi.fn>;
  };

  function createComponent(): EmployeeAttendanceComponent {
    const injector = Injector.create({
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: PersianDateService, useValue: mockPersianDateService },
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
      getTodayAttendance: vi.fn(),
      registerAttendance: vi.fn(),
    };

    mockPersianDateService = {
      getTodayFormatted: vi.fn().mockReturnValue('چهارشنبه، ۲۳ مهر ۱۴۰۵'),
    };

    component = createComponent();
  });

  it('should load today attendance on ngOnInit', () => {
    const todayData: TodayAttendanceDto = {
      isCheckedIn: false,
      isCheckedOut: false,
      shift: {
        name: 'شیفت صبح',
        startTime: '08:00',
        endTime: '16:00',
      },
    };

    mockAttendanceService.getTodayAttendance.mockReturnValue(of(todayData));

    component.ngOnInit();

    expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
    expect(component.todayAttendance()).toEqual(todayData);
    expect(component.viewState()).toBe('ready');
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
    expect(component.viewState()).toBe('scanner');

    component.onScannerCancel();
    expect(component.viewState()).toBe('ready');
  });

  it('should set error state if geolocation is missing or denied', () => {
    (component as any).scannedQrCode = 'sample-qr-code';

    // Mock geolocation error
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error) => {
        error({ code: 1, PERMISSION_DENIED: 1 });
      }),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    (component as any).acquireLocationAndSubmit();

    expect(component.viewState()).toBe('error');
    expect(component.errorMessage()).toContain('دسترسی به موقعیت مکانی فعال نیست');
  });

  it('should submit attendance and transition to success state when location is obtained', () => {
    (component as any).scannedQrCode = 'sample-qr-code';

    const mockResponse: RegisterAttendanceResponseDto = {
      success: true,
      operationType: 'checkIn',
      checkInTime: '08:15',
      workLocationName: 'بیمارستان سینا',
    };

    mockAttendanceService.registerAttendance.mockReturnValue(of(mockResponse));

    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 35.6892,
            longitude: 51.389,
          },
        });
      }),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    (component as any).acquireLocationAndSubmit();

    expect(mockAttendanceService.registerAttendance).toHaveBeenCalledWith({
      qrCode: 'sample-qr-code',
      latitude: 35.6892,
      longitude: 51.389,
    });

    expect(component.viewState()).toBe('success');
    expect(component.todayAttendance()?.isCheckedIn).toBe(true);
    expect(component.todayAttendance()?.checkInTime).toBe('08:15');
  });

  it('should handle API 400 expired error gracefully with clean Persian message', () => {
    (component as any).scannedQrCode = 'expired-qr-code';

    mockAttendanceService.registerAttendance.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: { message: 'QR token expired' },
      }))
    );

    (component as any).submitAttendance(35.6892, 51.389);

    expect(component.viewState()).toBe('error');
    expect(component.errorMessage()).toBe('QR منقضی شده است. لطفاً QR جدید محل کار را اسکن کنید.');
  });
});
