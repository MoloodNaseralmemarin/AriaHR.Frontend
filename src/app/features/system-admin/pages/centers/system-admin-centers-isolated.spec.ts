import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';

import { SystemAdminCentersComponent } from './system-admin-centers.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { OrganizationResponseDto } from '../../../organizations/models/organization-response.dto';
import { OrganizationType } from '../../../organizations/models/organization-type.enum';

describe('SystemAdminCentersComponent (Isolated Tests)', () => {
  let component: SystemAdminCentersComponent;
  let mockOrgService: { getOrganizations: any };

  const mockOrgs: OrganizationResponseDto[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'کلینیک پارس',
      code: 'ORG-001',
      organizationType: OrganizationType.Clinic,
      managerFullName: 'علی رضایی',
      managerMobile: '09121112233',
      centerPhone: '02188888888',
      isActive: true,
      createdAtUtc: '2026-10-21T09:25:16.108Z',
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'مرکز تصویربرداری شیراز',
      code: 'ORG-002',
      type: OrganizationType.ImagingCenter,
      nationalIdentifier: '0987654321',
      phone: '07133333333',
      address: 'شیراز',
      managerFirstName: 'مریم',
      managerLastName: 'احمدی',
      managerMobile: '09173334455',
      isActive: false,
      createdAt: '2026-05-10T10:00:00Z',
    },
  ];

  beforeEach(() => {
    mockOrgService = {
      getOrganizations: vi.fn().mockReturnValue(of(mockOrgs)),
    };

    const injector = Injector.create({
      providers: [{ provide: OrganizationService, useValue: mockOrgService }],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminCentersComponent();
    });
  });

  it('should call getOrganizations on init and populate organizations list', () => {
    component.ngOnInit();

    expect(mockOrgService.getOrganizations).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.organizations().length).toBe(2);
    expect(component.filteredOrganizations().length).toBe(2);
  });

  it('should filter organizations by query matching name, code, manager, or phone', () => {
    component.ngOnInit();

    // Match by name
    component.query.set('پارس');
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].name).toBe('کلینیک پارس');

    // Match by code
    component.query.set('ORG-002');
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].code).toBe('ORG-002');

    // Match by manager name
    component.query.set('رضایی');
    expect(component.filteredOrganizations().length).toBe(1);

    // Match by phone/mobile
    component.query.set('09173334455');
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('should filter organizations by isActive status', () => {
    component.ngOnInit();

    component.filter.set('active');
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].isActive).toBe(true);

    component.filter.set('inactive');
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].isActive).toBe(false);

    component.filter.set('all');
    expect(component.filteredOrganizations().length).toBe(2);
  });

  it('should handle API errors and support retry', () => {
    mockOrgService.getOrganizations.mockReturnValue(throwError(() => new Error('Server Error')));

    component.loadOrganizations();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Server Error');
    expect(component.organizations().length).toBe(0);

    // Retry
    mockOrgService.getOrganizations.mockReturnValue(of(mockOrgs));
    component.loadOrganizations();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.organizations().length).toBe(2);
  });

  it('should format labels, phones, dates, and managers correctly via helper methods', () => {
    expect(component.getTypeLabel(mockOrgs[0])).toBe('کلینیک');
    expect(component.getTypeLabel(mockOrgs[1])).toBe('مرکز تصویربرداری');
    expect(component.getStatusLabel(true)).toBe('فعال');
    expect(component.getStatusLabel(false)).toBe('غیرفعال');

    expect(component.getManagerFullName(mockOrgs[0])).toBe('علی رضایی');
    expect(component.getManagerFullName(mockOrgs[1])).toBe('مریم احمدی');

    expect(component.getCenterPhone(mockOrgs[0])).toBe('02188888888');
    expect(component.getCenterPhone(mockOrgs[1])).toBe('07133333333');

    expect(component.getCreatedAtUtc(mockOrgs[0])).toBe('2026-10-21T09:25:16.108Z');
    expect(component.getCreatedAtUtc(mockOrgs[1])).toBe('2026-05-10T10:00:00Z');

    const emptyOrg: OrganizationResponseDto = {
      id: '99',
      name: 'مرکز بدون مشخصات',
      isActive: true,
    };
    expect(component.getManagerFullName(emptyOrg)).toBe('—');
    expect(component.getCenterPhone(emptyOrg)).toBe('—');
    expect(component.getCreatedAtUtc(emptyOrg)).toBeNull();
  });
});
