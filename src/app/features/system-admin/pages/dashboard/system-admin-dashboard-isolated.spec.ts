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
import { OrganizationDashboardSummaryDto } from '../../../organizations/models/organization-dashboard-summary.dto';
import { RecentOrganizationDto } from '../../../organizations/models/recent-organization.dto';
import { RecentActivityDto } from '../../models/recent-activity.dto';

describe('SystemAdminDashboardComponent (Isolated Tests)', () => {
  let component: SystemAdminDashboardComponent;
  let mockOrgService: { getDashboardSummary: any; getRecentOrganizations: any };
  let mockDashboardService: { getRecentActivities: any };
  let mockAuthService: { getCurrentUser: any; userDetails: any };
  let mockDataService: any;
  let mockPersianDateService: any;

  const mockSummary: OrganizationDashboardSummaryDto = {
    totalCenters: 10,
    activeCenters: 8,
    pendingCenters: 2,
    totalManagers: 12,
    totalEmployees: 150,
    newCentersThisMonth: 3,
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
      getDashboardSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getRecentOrganizations: vi.fn().mockReturnValue(of(mockRecentOrgs)),
    };
    mockDashboardService = {
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

  it('should instantiate component and load initial data on ngOnInit', () => {
    component.ngOnInit();

    expect(mockOrgService.getDashboardSummary).toHaveBeenCalledTimes(1);
    expect(mockOrgService.getRecentOrganizations).toHaveBeenCalledTimes(1);
    expect(mockDashboardService.getRecentActivities).toHaveBeenCalledTimes(1);

    expect(component.isLoadingSummary()).toBe(false);
    expect(component.isLoadingRecentOrgs()).toBe(false);
    expect(component.isLoadingRecentActivities()).toBe(false);

    expect(component.stats()).toEqual({
      totalCenters: 10,
      activeCenters: 8,
      pendingCenters: 2,
      totalManagers: 12,
      totalEmployees: 150,
      newCentersThisMonth: 3,
    });

    expect(component.recentCenters().length).toBe(1);
    expect(component.recentCenters()[0].managerName).toBe('علی رضایی');

    expect(component.recentActivity().length).toBe(1);
    expect(component.recentActivity()[0].label).toBe('ثبت مرکز جدید');
  });

  it('should handle partial API errors gracefully with soft fallback', () => {
    mockDashboardService.getRecentActivities.mockReturnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.summaryError()).toBe(false);
    expect(component.recentOrgsError()).toBe(false);
    expect(component.recentActivitiesError()).toBe(true);

    expect(component.stats().totalCenters).toBe(10);
    expect(component.recentCenters().length).toBe(1);
  });

  it('should calculate status tones correctly', () => {
    expect(component.getStatusTone('active')).toBe('success');
    expect(component.getStatusTone('pending')).toBe('warning');
    expect(component.getStatusTone('inactive')).toBe('danger');
  });
});
