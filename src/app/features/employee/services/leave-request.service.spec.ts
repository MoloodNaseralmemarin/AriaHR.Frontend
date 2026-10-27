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

  it('should get authenticated employee leave requests via GET /api/requests/my and normalize raw response', () => {
    const rawData = [
      {
        id: '1',
        leaveType: 2,
        categoryName: 'مرخصی استحقاقی',
        startDate: '2025-02-10',
        endDate: '2025-02-12',
        status: 1,
        createdAt: '2025-02-09T10:00:00Z',
        managerName: 'علی رضایی',
      },
      {
        id: '2',
        leaveType: 1,
        categoryName: 'مرخصی ساعتی',
        startDate: '2025-02-15',
        endDate: '2025-02-15',
        startTime: '08:30:00',
        endTime: '12:30:00',
        status: 2,
        rejectionReason: 'عدم موافقت با زمان درخواست',
        createdAt: '2025-02-10T12:00:00Z',
      },
    ];
    httpClientMock.get.mockReturnValue(of({ items: rawData }));

    service.getLeaveRequests().subscribe((res) => {
      expect(res.length).toBe(2);
      expect(res[0].leaveType).toBe('daily');
      expect(res[0].categoryName).toBe('مرخصی استحقاقی');
      expect(res[0].status).toBe('approved');
      expect(res[0].approverName).toBe('علی رضایی');
      expect(res[0].durationText).toBe('3 روز');

      expect(res[1].leaveType).toBe('hourly');
      expect(res[1].startTime).toBe('08:30');
      expect(res[1].endTime).toBe('12:30');
      expect(res[1].status).toBe('rejected');
      expect(res[1].rejectionReason).toBe('عدم موافقت با زمان درخواست');
      expect(res[1].durationText).toBe('4 ساعت');
    });

    expect(httpClientMock.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/requests/my`);
  });

  it('should create a daily leave request via POST /api/requests/leave with leaveType 2', () => {
    const dto = {
      leaveType: 2,
      leaveCategoryId: 'cat-1',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      startTime: null,
      endTime: null,
      reason: 'استراحت',
    };

    const rawResponse = {
      id: '1',
      leaveType: 2,
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      reason: 'استراحت',
      status: 0,
      createdAt: '2025-02-09T10:00:00Z',
    };
    httpClientMock.post.mockReturnValue(of(rawResponse));

    service.createLeaveRequest(dto).subscribe((res) => {
      expect(res.id).toBe('1');
      expect(res.leaveType).toBe('daily');
      expect(res.status).toBe('pending');
      expect(res.durationText).toBe('3 روز');
    });

    expect(httpClientMock.post).toHaveBeenCalledWith(`${environment.apiUrl}/api/requests/leave`, dto);
  });

  it('should normalize hourly duration and remove seconds from start and end times', () => {
    const raw = {
      id: '10',
      leaveType: 1,
      startTime: '09:15:00',
      endTime: '11:45:00',
      status: 'pending',
    };
    const normalized = service.normalizeLeaveRequest(raw);
    expect(normalized.leaveType).toBe('hourly');
    expect(normalized.startTime).toBe('09:15');
    expect(normalized.endTime).toBe('11:45');
    expect(normalized.durationText).toBe('2 ساعت و 30 دقیقه');
  });
});
