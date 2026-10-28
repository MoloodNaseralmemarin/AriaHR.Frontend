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
        startTime: '08:30',
        endTime: '12:30',
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

  it('should normalize hourly duration with hours and minutes accurately', () => {
    const raw = {
      id: '10',
      leaveType: 1,
      startTime: '09:15',
      endTime: '11:45',
      status: 'pending',
    };
    const normalized = service.normalizeLeaveRequest(raw);
    expect(normalized.leaveType).toBe('hourly');
    expect(normalized.durationText).toBe('2 ساعت و 30 دقیقه');
  });

  it('should approve leave request via POST /api/requests/{id}/approve', () => {
    const rawResponse = {
      id: 'req-123',
      status: 1,
      approvedBy: 'مدیر کلینیک',
      approvedAt: '2026-10-27T10:00:00Z',
    };
    httpClientMock.post.mockReturnValue(of(rawResponse));

    service.approveLeaveRequest('req-123', 'موافقت شد').subscribe((res) => {
      expect(res.id).toBe('req-123');
      expect(res.status).toBe('approved');
      expect(res.approvedBy).toBe('مدیر کلینیک');
    });

    expect(httpClientMock.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/requests/req-123/approve`,
      { comment: 'موافقت شد' }
    );
  });

  it('should reject leave request via POST /api/requests/{id}/reject', () => {
    const rawResponse = {
      id: 'req-123',
      status: 2,
      rejectedReason: 'عدم حضور جایگزین',
    };
    httpClientMock.post.mockReturnValue(of(rawResponse));

    service.rejectLeaveRequest('req-123', 'عدم حضور جایگزین').subscribe((res) => {
      expect(res.id).toBe('req-123');
      expect(res.status).toBe('rejected');
      expect(res.rejectedReason).toBe('عدم حضور جایگزین');
    });

    expect(httpClientMock.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/requests/req-123/reject`,
      { reason: 'عدم حضور جایگزین', rejectedReason: 'عدم حضور جایگزین' }
    );
  });
});
