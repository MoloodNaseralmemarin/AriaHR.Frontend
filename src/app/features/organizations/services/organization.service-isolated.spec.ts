import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { OrganizationService } from './organization.service';
import { CenterResponseDto } from '../models/center-response.dto';

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
});
