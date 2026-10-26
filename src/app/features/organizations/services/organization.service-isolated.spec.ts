import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { OrganizationService } from './organization.service';
import { CenterResponseDto } from '../models/center-response.dto';
import { CreateOrganizationDto } from '../models/create-organization.dto';
import { OrganizationResponseDto } from '../models/organization-response.dto';
import { OrganizationType } from '../models/organization-type.enum';

describe('OrganizationService (Isolated Specs)', () => {
  let service: OrganizationService;
  let mockHttpClient: { get: any; post: any };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        OrganizationService,
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });

    runInInjectionContext(injector, () => {
      service = new OrganizationService();
    });
  });

  it('getOrganizationCenters should perform GET request to /api/organizations/{orgId}/centers', () => {
    const mockCenters: CenterResponseDto[] = [
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
      expect.stringContaining('/api/organizations/org-123/centers')
    );
  });

  it('createOrganization should send POST request to /api/organizations with CreateOrganizationDto', () => {
    const requestPayload: CreateOrganizationDto = {
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
      managerEmail: 'reza@example.com',
      isActive: true,
      createdAtUtc: '2026-10-26T13:49:12.552Z',
      createdByUserId: null,
    };

    mockHttpClient.post.mockReturnValue(of(responsePayload));

    service.createOrganization(requestPayload).subscribe((result) => {
      expect(result).toEqual(responsePayload);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/organizations'),
      requestPayload
    );
  });

  it('getOrganizations should send GET request to /api/organizations', () => {
    const mockList: OrganizationResponseDto[] = [
      {
        id: 'org-1',
        name: 'مرکز ۱',
        isActive: true,
      },
    ];

    mockHttpClient.get.mockReturnValue(of(mockList));

    service.getOrganizations().subscribe((data) => {
      expect(data).toEqual(mockList);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/organizations')
    );
  });
});
