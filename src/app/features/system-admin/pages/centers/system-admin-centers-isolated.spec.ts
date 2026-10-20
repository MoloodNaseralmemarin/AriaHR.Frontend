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
      id: '1',
      name: 'کلینیک پارس',
      code: 'ORG-001',
      type: OrganizationType.Clinic,
      nationalIdentifier: '1234567890',
      phone: '02188888888',
      address: 'تهران',
      managerFirstName: 'علی',
      managerLastName: 'رضایی',
      managerMobile: '09121112233',
      isActive: true,
    },
    {
      id: '2',
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
    expect(component.filteredOrganizations()[0].id).toBe('2');
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

  it('should format labels correctly via helper methods', () => {
    expect(component.getTypeLabel(OrganizationType.Clinic)).toBe('کلینیک');
    expect(component.getTypeLabel(OrganizationType.ImagingCenter)).toBe('مرکز تصویربرداری');
    expect(component.getStatusLabel(true)).toBe('فعال');
    expect(component.getStatusLabel(false)).toBe('غیرفعال');

    const sampleOrg = mockOrgs[0];
    expect(component.getManagerFullName(sampleOrg)).toBe('علی رضایی');

    const emptyManagerOrg: OrganizationResponseDto = {
      ...sampleOrg,
      managerFirstName: null,
      managerLastName: null,
    };
    expect(component.getManagerFullName(emptyManagerOrg)).toBe('تعیین نشده');
  });
});
