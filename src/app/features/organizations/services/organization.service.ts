import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BranchListItemDto } from '../models/branch-list-item.dto';
import { CenterStatusUpdateDto } from '../models/center-status-update.dto';
import { CreateOrganizationDto } from '../models/create-organization.dto';
import { OrganizationCountResponseDto } from '../models/organization-count-response.dto';
import { OrganizationDashboardSummaryDto } from '../models/organization-dashboard-summary.dto';
import { OrganizationListItemDto } from '../models/organization-list-item.dto';
import { OrganizationResponseDto } from '../models/organization-response.dto';
import { RecentOrganizationDto } from '../models/recent-organization.dto';
import { UpdateCenterDto } from '../models/update-center.dto';

/**
 * API service for the Organization module.
 *
 * Organizations: `/api/organizations` (OrganizationsController).
 * Centers (branches): `/api/centers` (CentersController).
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/organizations`;
  private readonly centersUrl = `${environment.apiUrl}/api/centers`;

  /**
   * Lists organizations (SystemAdmin only).
   * GET /api/organizations
   */
  getOrganizations(): Observable<OrganizationListItemDto[]> {
    return this.http.get<OrganizationListItemDto[]>(this.apiUrl);
  }

  /**
   * Lists the centers (branches) of an organization.
   * GET /api/organizations/{organizationId}/centers
   */
  getOrganizationCenters(organizationId: string): Observable<BranchListItemDto[]> {
    return this.http.get<BranchListItemDto[]>(
      `${this.apiUrl}/${organizationId}/centers`
    );
  }

  /**
   * Creates an organization together with its manager account.
   * POST /api/organizations
   */
  createOrganization(request: CreateOrganizationDto): Observable<OrganizationResponseDto> {
    return this.http.post<OrganizationResponseDto>(this.apiUrl, request);
  }

  /**
   * Dashboard summary of organizations (SystemAdmin only).
   * GET /api/organizations/dashboard-summary
   */
  getDashboardSummary(): Observable<OrganizationDashboardSummaryDto> {
    return this.http.get<OrganizationDashboardSummaryDto>(`${this.apiUrl}/dashboard-summary`);
  }

  /**
   * Recently created organizations (SystemAdmin only).
   * GET /api/organizations/recent
   */
  getRecentOrganizations(): Observable<RecentOrganizationDto[]> {
    return this.http.get<RecentOrganizationDto[]>(`${this.apiUrl}/recent`);
  }

  /**
   * Total number of organizations (SystemAdmin only).
   * GET /api/organizations/count
   */
  getOrganizationCount(): Observable<OrganizationCountResponseDto> {
    return this.http.get<OrganizationCountResponseDto>(`${this.apiUrl}/count`);
  }

  /**
   * Updates a center (branch). CenterManager is restricted to their own organization.
   * PUT /api/centers/{centerId}
   */
  updateCenter(centerId: string, request: UpdateCenterDto): Observable<BranchListItemDto> {
    return this.http.put<BranchListItemDto>(`${this.centersUrl}/${centerId}`, request);
  }

  /**
   * Activates or deactivates a center (branch).
   * PATCH /api/centers/{centerId}/status
   */
  updateCenterStatus(
    centerId: string,
    request: CenterStatusUpdateDto
  ): Observable<BranchListItemDto> {
    return this.http.patch<BranchListItemDto>(
      `${this.centersUrl}/${centerId}/status`,
      request
    );
  }
}
