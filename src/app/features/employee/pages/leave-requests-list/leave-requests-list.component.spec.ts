import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { LeaveRequestsListComponent } from './leave-requests-list.component';
import { LeaveRequestService } from '../../services/leave-request.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { LeaveRequestDto } from '../../models/leave-request.model';
import { of, throwError } from 'rxjs';

describe('LeaveRequestsListComponent', () => {
  let component: LeaveRequestsListComponent;
  let leaveRequestServiceMock: any;

  beforeEach(() => {
    leaveRequestServiceMock = {
      getLeaveRequests: vi.fn(),
    };

    const parentInjector = {
      get: (token: any, notFoundValue?: any) => notFoundValue,
    } as any;

    const injector = createEnvironmentInjector([
      { provide: LeaveRequestService, useValue: leaveRequestServiceMock },
      { provide: PersianDateService, useClass: PersianDateService },
    ], parentInjector);

    runInInjectionContext(injector, () => {
      component = new LeaveRequestsListComponent();
    });
  });

  it('should load requests and compute summary counts', () => {
    const mockData: LeaveRequestDto[] = [
      { id: '1', leaveType: 'daily', startDate: '2025-02-10', endDate: '2025-02-12', durationText: '3 روز', status: 'pending', createdAt: '2025-02-09T10:00:00Z' },
      { id: '2', leaveType: 'hourly', date: '2025-02-15', startTime: '08:30', endTime: '12:30', durationText: '4 ساعت', status: 'approved', createdAt: '2025-02-10T12:00:00Z' },
      { id: '3', leaveType: 'daily', startDate: '2025-01-01', endDate: '2025-01-02', durationText: '2 روز', status: 'rejected', createdAt: '2025-01-01T08:00:00Z' },
    ];
    leaveRequestServiceMock.getLeaveRequests.mockReturnValue(of(mockData));

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.requests().length).toBe(3);
    expect(component.summary()).toEqual({
      pendingCount: 1,
      approvedCount: 1,
      rejectedCount: 1,
    });
  });

  it('should handle API error state correctly', () => {
    leaveRequestServiceMock.getLeaveRequests.mockReturnValue(throwError(() => new Error('API error')));

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMsg()).toBe('خطا در دریافت اطلاعات درخواست‌های مرخصی. لطفاً مجدداً تلاش کنید.');
  });

  it('should open and close details drawer', () => {
    const mockReq: LeaveRequestDto = {
      id: '1',
      leaveType: 'daily',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      durationText: '3 روز',
      status: 'pending',
      createdAt: '2025-02-09T10:00:00Z',
    };

    component.openDetails(mockReq);
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedRequest()).toEqual(mockReq);

    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);
  });
});
