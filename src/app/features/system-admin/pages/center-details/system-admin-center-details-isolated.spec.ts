import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SystemAdminCenterDetailsComponent } from './system-admin-center-details.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { CenterResponseDto } from '../../../organizations/models/center-response.dto';

describe('SystemAdminCenterDetailsComponent (Isolated Tests)', () => {
  let component: SystemAdminCenterDetailsComponent;
  let mockOrgService: { getOrganizationCenters: any };
  let mockRoute: {
    snapshot: {
      paramMap: any;
      queryParamMap: any;
    };
    paramMap: any;
  };

  const mockCenters: CenterResponseDto[] = [
    {
      id: 'center-101',
      organizationId: 'org-202',
      name: 'مرکز تخصصی قلبی',
      code: 'C-101',
      address: 'تهران، خیابان ولیعصر',
      phone: '02188887766',
      email: 'cardio@center.com',
      isActive: true,
    },
    {
      id: 'center-102',
      organizationId: 'org-202',
      name: 'درمانگاه شبانه‌روزی',
      code: '',
      address: null,
      phone: undefined,
      email: '',
      isActive: false,
    },
  ];

  beforeEach(() => {
    mockOrgService = {
      getOrganizationCenters: vi.fn().mockReturnValue(of(mockCenters)),
    };

    mockRoute = {
      snapshot: {
        paramMap: convertToParamMap({ id: 'center-101' }),
        queryParamMap: convertToParamMap({ organizationId: 'org-202' }),
      },
      paramMap: of(convertToParamMap({ id: 'center-101' })),
    };

    const injector = Injector.create({
      providers: [
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminCenterDetailsComponent();
    });
  });

  it('should fetch organization centers and select center matching route id', () => {
    component.ngOnInit();

    expect(mockOrgService.getOrganizationCenters).toHaveBeenCalledWith('org-202');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.center()).toEqual(mockCenters[0]);
    expect(component.center()?.name).toBe('مرکز تخصصی قلبی');
  });

  it('should set error message when center ID is not found in returned organization centers', () => {
    mockRoute.snapshot.paramMap = convertToParamMap({ id: 'center-non-existent' });

    component.loadCenterDetails();

    expect(component.loading()).toBe(false);
    expect(component.center()).toBeNull();
    expect(component.error()).toBe('مرکز مورد نظر با این شناسه یافت نشد.');
  });

  it('should set error message when API fails and allow retry', () => {
    mockOrgService.getOrganizationCenters.mockReturnValue(
      throwError(() => new Error('ارتباط با سرور برقرار نشد'))
    );

    component.loadCenterDetails();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('ارتباط با سرور برقرار نشد');

    // Retry
    mockOrgService.getOrganizationCenters.mockReturnValue(of(mockCenters));
    component.loadCenterDetails();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.center()).toEqual(mockCenters[0]);
  });

  it('should handle missing route params gracefully', () => {
    mockRoute.snapshot.paramMap = convertToParamMap({});
    mockRoute.snapshot.queryParamMap = convertToParamMap({});

    component.loadCenterDetails();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('شناسه مرکز یا سازمان معتبر نیست.');
  });

  it('should format null, empty, or whitespace values as «ثبت نشده»', () => {
    expect(component.getDisplayValue('تهران')).toBe('تهران');
    expect(component.getDisplayValue(null)).toBe('ثبت نشده');
    expect(component.getDisplayValue(undefined)).toBe('ثبت نشده');
    expect(component.getDisplayValue('')).toBe('ثبت نشده');
    expect(component.getDisplayValue('   ')).toBe('ثبت نشده');
  });

  it('should format status labels correctly', () => {
    expect(component.getStatusLabel(true)).toBe('فعال');
    expect(component.getStatusLabel(false)).toBe('غیرفعال');
  });
});
