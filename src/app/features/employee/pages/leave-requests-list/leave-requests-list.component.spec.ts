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

  it('should load requests via getLeaveRequests and compute summary counts from list', () => {
    const mockData: LeaveRequestDto[] = [
      { id: '1', leaveType: 'daily', categoryName: 'استحقاقی', startDate: '2025-02-10', endDate: '2025-02-12', durationText: '3 روز', status: 'pending', createdAt: '2025-02-09T10:00:00Z' },
      { id: '2', leaveType: 'hourly', categoryName: 'ساعتی', date: '2025-02-15', startTime: '08:30', endTime: '12:30', durationText: '4 ساعت', status: 'approved', createdAt: '2025-02-10T12:00:00Z' },
      { id: '3', leaveType: 'daily', categoryName: 'استعلاجی', startDate: '2025-01-01', endDate: '2025-01-02', durationText: '2 روز', status: 'rejected', createdAt: '2025-01-01T08:00:00Z' },
    ];
    leaveRequestServiceMock.getLeaveRequests.mockReturnValue(of(mockData));

    component.ngOnInit();

    expect(leaveRequestServiceMock.getLeaveRequests).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.requests().length).toBe(3);
    expect(component.summary()).toEqual({
      pendingCount: 1,
      approvedCount: 1,
      rejectedCount: 1,
    });
  });

  it('should filter requests by status and leave type', () => {
    const mockData: LeaveRequestDto[] = [
      { id: '1', leaveType: 'daily', startDate: '2025-02-10', endDate: '2025-02-12', durationText: '3 روز', status: 'pending', createdAt: '2025-02-09T10:00:00Z' },
      { id: '2', leaveType: 'hourly', date: '2025-02-15', startTime: '08:30', endTime: '12:30', durationText: '4 ساعت', status: 'approved', createdAt: '2025-02-10T12:00:00Z' },
      { id: '3', leaveType: 'daily', startDate: '2025-01-01', endDate: '2025-01-02', durationText: '2 روز', status: 'rejected', createdAt: '2025-01-01T08:00:00Z' },
    ];
    leaveRequestServiceMock.getLeaveRequests.mockReturnValue(of(mockData));

    component.ngOnInit();

    // Filter by status 'pending'
    component.setStatusFilter('pending');
    expect(component.filteredRequests().length).toBe(1);
    expect(component.filteredRequests()[0].id).toBe('1');

    // Filter by type 'hourly'
    component.setStatusFilter('all');
    component.setTypeFilter('hourly');
    expect(component.filteredRequests().length).toBe(1);
    expect(component.filteredRequests()[0].id).toBe('2');

    // Reset filters
    component.resetFilters();
    expect(component.filteredRequests().length).toBe(3);
  });

  it('should format single-day vs multi-day daily leave date display properly', () => {
    const singleDay: LeaveRequestDto = {
      id: '1',
      leaveType: 'daily',
      startDate: '2025-02-10',
      endDate: '2025-02-10',
      durationText: '1 روز',
      status: 'pending',
      createdAt: '2025-02-09T10:00:00Z',
    };
    const multiDay: LeaveRequestDto = {
      id: '2',
      leaveType: 'daily',
      startDate: '2025-02-10',
      endDate: '2025-02-12',
      durationText: '3 روز',
      status: 'pending',
      createdAt: '2025-02-09T10:00:00Z',
    };

    const singleDisplay = component.getDisplayDate(singleDay);
    const multiDisplay = component.getDisplayDate(multiDay);

    expect(singleDisplay).not.toContain('تا');
    expect(multiDisplay).toContain('تا');
  });

  it('should handle invalid default dates (0001-01-01) safely without crashing', () => {
    const invalidReq: LeaveRequestDto = {
      id: '99',
      leaveType: 'daily',
      startDate: '0001-01-01T00:00:00Z',
      endDate: '0001-01-01T00:00:00Z',
      durationText: '',
      status: 'pending',
      createdAt: '2025-02-09T10:00:00Z',
    };

    expect(component.getDisplayDate(invalidReq)).toBe('تعیین نشده');
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
      categoryName: 'مرخصی استحقاقی',
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
