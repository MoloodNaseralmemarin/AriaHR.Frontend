import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SystemAdminDashboardComponent } from './system-admin-dashboard.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrganizationDashboardSummaryDto } from '../../../organizations/models/organization-dashboard-summary.dto';

describe('SystemAdminDashboardComponent API Integration', () => {
  let mockOrgService: { getDashboardSummary: any };
  let mockAuthService: { getCurrentUser: any; userDetails: any };

  const mockSummary: OrganizationDashboardSummaryDto = {
    totalCenters: 10,
    activeCenters: 8,
    pendingCenters: 2,
    totalManagers: 12,
    totalEmployees: 150,
    newCentersThisMonth: 3,
  };

  beforeEach(() => {
    mockOrgService = {
      getDashboardSummary: vi.fn().mockReturnValue(of(mockSummary)),
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
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should call getDashboardSummary on init and populate stats signal with camelCase payload', () => {
    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit

    expect(mockOrgService.getDashboardSummary).toHaveBeenCalledTimes(1);
    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.stats()).toEqual({
      totalCenters: 10,
      activeCenters: 8,
      pendingCenters: 2,
      totalManagers: 12,
      totalEmployees: 150,
      newCentersThisMonth: 3,
    });
  });

  it('should populate stats signal cleanly when API returns PascalCase payload', () => {
    const pascalSummary: OrganizationDashboardSummaryDto = {
      TotalCenters: 25,
      ActiveCenters: 20,
      PendingCenters: 5,
      TotalManagers: 25,
      TotalEmployees: 300,
      NewCentersThisMonth: 4,
    };
    mockOrgService.getDashboardSummary.mockReturnValue(of(pascalSummary));

    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.stats()).toEqual({
      totalCenters: 25,
      activeCenters: 20,
      pendingCenters: 5,
      totalManagers: 25,
      totalEmployees: 300,
      newCentersThisMonth: 4,
    });
  });

  it('should preserve valid 0 values in dashboard summary stats', () => {
    const zeroSummary: OrganizationDashboardSummaryDto = {
      totalCenters: 0,
      activeCenters: 0,
      pendingCenters: 0,
      totalManagers: 0,
      totalEmployees: 0,
      newCentersThisMonth: 0,
    };
    mockOrgService.getDashboardSummary.mockReturnValue(of(zeroSummary));

    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.stats().totalCenters).toBe(0);
    expect(component.stats().activeCenters).toBe(0);
    expect(component.stats().totalManagers).toBe(0);
    expect(component.stats().totalEmployees).toBe(0);
  });

  it('should handle API error gracefully without crashing', () => {
    mockOrgService.getDashboardSummary.mockReturnValue(throwError(() => new Error('API Error')));

    const fixture = TestBed.createComponent(SystemAdminDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);
    expect(component.stats()).toBeTruthy(); // fallback to local default stats
  });
});
