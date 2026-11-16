import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { OrganizationService } from './organization.service';
import { BranchListItemDto } from '../models/branch-list-item.dto';
import { CreateOrganizationDto } from '../models/create-organization.dto';
import { OrganizationListItemDto } from '../models/organization-list-item.dto';
import { OrganizationResponseDto } from '../models/organization-response.dto';
import { OrganizationType } from '../models/organization-type.enum';
import { environment } from '../../../../environments/environment';

describe('OrganizationService (Isolated Specs)', () => {
  let service: OrganizationService;
  let mockHttpClient: { get: any; post: any; put: any; patch: any };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    const injector = Injector.create({
      providers: [OrganizationService, { provide: HttpClient, useValue: mockHttpClient }],
    });

    runInInjectionContext(injector, () => {
      service = new OrganizationService();
    });
  });

  it('getOrganizationCenters should GET /api/organizations/{orgId}/centers', () => {
    const mockCenters: BranchListItemDto[] = [
      {
        id: 'center-1',
        organizationId: 'org-123',
        name: 'مرکز اول',
        code: 'C01',
        address: 'تهران',
        phone: '02112345678',
        email: 'center1@test.com',
        isActive: true,
      },
    ];

    mockHttpClient.get.mockReturnValue(of(mockCenters));

    service.getOrganizationCenters('org-123').subscribe((data) => {
      expect(data).toEqual(mockCenters);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/organizations/org-123/centers`
    );
  });

  it('createOrganization should POST the CreateOrganizationRequest body', () => {
    const requestPayload: CreateOrganizationDto = {
      name: 'کلینیک پارس',
      code: 'PARS-100',
      type: OrganizationType.Clinic,
      nationalIdentifier: null,
      phone: '02188888888',
      address: 'خیابان ولیعصر',
      managerFirstName: 'رضا',
      managerLastName: 'رضایی',
      managerMobile: '09121112233',
      managerEmail: 'reza@example.com',
      isActive: true,
    };

    const responsePayload: OrganizationResponseDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'کلینیک پارس',
      code: 'PARS-100',
      type: OrganizationType.Clinic,
      organizationType: OrganizationType.Clinic,
      nationalIdentifier: null,
      phone: '02188888888',
      address: 'خیابان ولیعصر',
      managerFirstName: 'رضا',
      managerLastName: 'رضایی',
      managerMobile: '09121112233',
      isActive: true,
      createdAtUtc: '2026-10-26T13:49:12.552Z',
      createdByUserId: null,
    };

    mockHttpClient.post.mockReturnValue(of(responsePayload));

    service.createOrganization(requestPayload).subscribe((result) => {
      expect(result).toEqual(responsePayload);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/organizations`,
      requestPayload
    );
  });

  it('getOrganizations should GET /api/organizations', () => {
    const mockList: OrganizationListItemDto[] = [
      {
        id: 'org-1',
        name: 'مرکز ۱',
        code: 'C-1',
        organizationType: OrganizationType.Clinic,
        managerFullName: 'رضا رضایی',
        managerMobile: '09120000000',
        centerPhone: '02100000000',
        isActive: true,
        createdAtUtc: '2026-10-26T13:49:12.552Z',
      },
    ];

    mockHttpClient.get.mockReturnValue(of(mockList));

    service.getOrganizations().subscribe((data) => {
      expect(data).toEqual(mockList);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/organizations`);
  });

  it('getOrganizationCount should read the { totalCount } response', () => {
    mockHttpClient.get.mockReturnValue(of({ totalCount: 7 }));

    let count = 0;
    service.getOrganizationCount().subscribe((res) => (count = res.totalCount));

    expect(count).toBe(7);
    expect(mockHttpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/organizations/count`);
  });

  it('updateCenter should PUT /api/centers/{centerId}', () => {
    const request = { name: 'مرکز اصلی', code: 'C-01', address: null, phone: null, email: null };
    mockHttpClient.put.mockReturnValue(of({ id: 'center-1' }));

    service.updateCenter('center-1', request).subscribe();

    expect(mockHttpClient.put).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/centers/center-1`,
      request
    );
  });

  it('updateCenterStatus should PATCH /api/centers/{centerId}/status', () => {
    mockHttpClient.patch.mockReturnValue(of({ id: 'center-1', isActive: false }));

    service.updateCenterStatus('center-1', { isActive: false }).subscribe();

    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/centers/center-1/status`,
      { isActive: false }
    );
  });
});
