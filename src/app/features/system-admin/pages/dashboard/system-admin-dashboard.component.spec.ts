import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { SystemAdminDashboardComponent } from './system-admin-dashboard.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrganizationDashboardSummaryDto } from '../../../organizations/models/organization-dashboard-summary.dto';
import { RecentOrganizationDto } from '../../../organizations/models/recent-organization.dto';
import { RecentActivityDto } from '../../models/recent-activity.dto';

describe('SystemAdminDashboardComponent API Integration', () => {
  let mockOrgService: { getDashboardSummary: any; getRecentOrganizations: any; getOrganizationCount: any };
  let mockDashboardService: { getRecentActivities: any };
  let mockAuthService: { getCurrentUser: any; userDetails: any };

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
      getOrganizationCount: vi.fn().mockReturnValue(of(10)),
    };
    mockDashboardService = {
      getRecentActivities: vi.fn().mockReturnValue(of(mockRecentActivities)),
    };
    mockAuthService = {
      getCurrentUser: vi.fn().mockReturnValue(of(null)),
      userDetails: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      imports: [SystemAdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should call getDashboardSummary, getRecentOrganizations, and getRecentActivities on init', () => {
    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

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

    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.summaryError()).toBe(false);
    expect(component.recentOrgsError()).toBe(false);
    expect(component.recentActivitiesError()).toBe(true);

    // Dashboard summary & recent orgs still work fine
    expect(component.stats().totalCenters).toBe(10);
    expect(component.recentCenters().length).toBe(1);
  });
});
