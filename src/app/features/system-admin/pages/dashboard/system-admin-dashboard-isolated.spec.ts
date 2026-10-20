import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { SystemAdminDashboardComponent } from './system-admin-dashboard.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { DashboardOverviewResponse } from '../../models/dashboard-overview.dto';
import { RecentOrganizationDto } from '../../../organizations/models/recent-organization.dto';
import { RecentActivityDto } from '../../models/recent-activity.dto';

describe('SystemAdminDashboardComponent (Isolated Tests)', () => {
  let component: SystemAdminDashboardComponent;
  let mockOrgService: { getRecentOrganizations: any };
  let mockDashboardService: { getOverview: any; getRecentActivities: any };
  let mockAuthService: { getCurrentUser: any; userDetails: any };
  let mockDataService: any;
  let mockPersianDateService: any;

  const mockOverview: DashboardOverviewResponse = {
    centers: {
      totalCount: 15,
      activeCount: 12,
      awaitingCompletionCount: 3,
    },
    centerManagers: {
      totalCount: 10,
    },
    employees: {
      totalCount: 200,
      createdThisMonth: 25,
    },
  };

  const mockRecentOrgs: RecentOrganizationDto[] = [
    {
      id: '1',
      name: 'کلینیک نمونه',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      isActive: true,
    },
  ];

  const mockRecentActivities: RecentActivityDto[] = [
    {
      id: 'a1',
      type: 'center_created',
      label: 'ثبت مرکز جدید',
      detail: 'کلینیک نمونه',
      timestamp: '2026-09-14T08:00:00Z',
    },
  ];

  beforeEach(() => {
    mockOrgService = {
      getRecentOrganizations: vi.fn().mockReturnValue(of(mockRecentOrgs)),
    };
    mockDashboardService = {
      getOverview: vi.fn().mockReturnValue(of(mockOverview)),
      getRecentActivities: vi.fn().mockReturnValue(of(mockRecentActivities)),
    };
    mockAuthService = {
      getCurrentUser: vi.fn().mockReturnValue(of(null)),
      userDetails: signal(null),
    };
    mockDataService = {
      stats: signal({
        totalCenters: 5,
        activeCenters: 4,
        pendingCenters: 1,
        totalManagers: 5,
        totalEmployees: 50,
        newCentersThisMonth: 1,
      }),
      getRecentCenters: vi.fn().mockReturnValue([]),
      getRecentActivity: vi.fn().mockReturnValue([]),
    };
    mockPersianDateService = {
      getTodayFormatted: vi.fn().mockReturnValue('۱۴۰۴/۰۶/۲۳'),
      getRelativeTime: vi.fn().mockReturnValue('۵ دقیقه پیش'),
    };

    const injector = Injector.create({
      providers: [
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SystemAdminDataService, useValue: mockDataService },
        { provide: PersianDateService, useValue: mockPersianDateService },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminDashboardComponent();
    });
  });

  it('should instantiate component and load overview statistics on ngOnInit', () => {
    component.ngOnInit();

    expect(mockDashboardService.getOverview).toHaveBeenCalledTimes(1);
    expect(mockOrgService.getRecentOrganizations).toHaveBeenCalledTimes(1);
    expect(mockDashboardService.getRecentActivities).toHaveBeenCalledTimes(1);

    expect(component.isLoadingOverview()).toBe(false);
    expect(component.overviewError()).toBe(false);
    expect(component.overviewData()).toEqual(mockOverview);

    expect(component.recentCenters().length).toBe(1);
    expect(component.recentCenters()[0].managerName).toBe('علی رضایی');

    expect(component.recentActivity().length).toBe(1);
    expect(component.recentActivity()[0].label).toBe('ثبت مرکز جدید');
  });

  it('should handle API errors when fetching overview data and support retry', () => {
    mockDashboardService.getOverview.mockReturnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.isLoadingOverview()).toBe(false);
    expect(component.overviewError()).toBe(true);
    expect(component.overviewData()).toBeNull();

    // Test retry action
    mockDashboardService.getOverview.mockReturnValue(of(mockOverview));
    component.loadDashboardOverview();

    expect(component.isLoadingOverview()).toBe(false);
    expect(component.overviewError()).toBe(false);
    expect(component.overviewData()).toEqual(mockOverview);
  });

  it('should calculate status tones correctly', () => {
    expect(component.getStatusTone('active')).toBe('success');
    expect(component.getStatusTone('pending')).toBe('warning');
    expect(component.getStatusTone('inactive')).toBe('danger');
  });
});
