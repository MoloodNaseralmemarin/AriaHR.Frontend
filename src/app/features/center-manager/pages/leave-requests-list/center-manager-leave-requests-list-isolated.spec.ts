import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CenterManagerLeaveRequestsListComponent } from './center-manager-leave-requests-list.component';
import { LeaveRequestService } from '../../../employee/services/leave-request.service';
import { LeaveRequestDto } from '../../../employee/models/leave-request.model';

describe('CenterManagerLeaveRequestsListComponent (isolated)', () => {
  let component: CenterManagerLeaveRequestsListComponent;
  let leaveRequestServiceMock: any;
  let activatedRouteMock: any;
  let routerMock: any;

  const mockRequests: LeaveRequestDto[] = [
    {
      id: 'req-1',
      leaveType: 'daily',
      employeeName: 'علی رضایی',
      categoryName: 'مرخصی استحقاقی',
      startDate: '2026-03-01',
      endDate: '2026-03-02',
      durationText: '2 روز',
      status: 'pending',
      createdAt: '2026-02-28T10:00:00Z',
    },
    {
      id: 'req-2',
      leaveType: 'hourly',
      employeeName: 'مریم احمدی',
      categoryName: 'مرخصی ساعتی',
      startDate: '2026-03-05',
      startTime: '09:00',
      endTime: '11:00',
      durationText: '2 ساعت',
      status: 'approved',
      createdAt: '2026-03-01T08:00:00Z',
    },
    {
      id: 'req-3',
      leaveType: 'daily',
      employeeName: 'حسین محمدی',
      categoryName: 'مرخصی استعلاجی',
      startDate: '2026-03-10',
      durationText: '1 روز',
      status: 'rejected',
      createdAt: '2026-03-02T12:00:00Z',
    },
  ];

  beforeEach(() => {
    leaveRequestServiceMock = {
      getAllLeaveRequests: vi.fn().mockReturnValue(of(mockRequests)),
    };

    activatedRouteMock = {
      queryParams: of({ status: 'pending' }),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: LeaveRequestService, useValue: leaveRequestServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
        { provide: CenterManagerLeaveRequestsListComponent, useClass: CenterManagerLeaveRequestsListComponent },
      ],
    });

    component = injector.get(CenterManagerLeaveRequestsListComponent);
  });

  it('should initialize, read queryParams and load leave requests', () => {
    component.ngOnInit();

    expect(component.selectedStatusFilter()).toBe('pending');
    expect(leaveRequestServiceMock.getAllLeaveRequests).toHaveBeenCalled();
    expect(component.requests().length).toBe(3);
    expect(component.isLoading()).toBe(false);
  });

  it('should calculate summary counts correctly', () => {
    component.ngOnInit();

    const summary = component.summary();
    expect(summary.totalCount).toBe(3);
    expect(summary.pendingCount).toBe(1);
    expect(summary.approvedCount).toBe(1);
    expect(summary.rejectedCount).toBe(1);
  });

  it('should filter requests by status and leave type', () => {
    component.ngOnInit();

    // With status 'pending' set from queryParams
    expect(component.filteredRequests().length).toBe(1);
    expect(component.filteredRequests()[0].id).toBe('req-1');

    // Change status filter to 'all'
    component.setStatusFilter('all');
    expect(component.filteredRequests().length).toBe(3);

    // Filter by type 'hourly'
    component.setTypeFilter('hourly');
    expect(component.filteredRequests().length).toBe(1);
    expect(component.filteredRequests()[0].id).toBe('req-2');
  });

  it('should handle API error gracefully', () => {
    leaveRequestServiceMock.getAllLeaveRequests.mockReturnValue(throwError(() => ({})));

    component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMsg()).toBe('خطایی در دریافت لیست درخواست‌های مرخصی رخ داد.');
  });
});
