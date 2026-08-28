import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateOrganizationDto } from '../models/create-organization.dto';
import { OrganizationResponseDto } from '../models/organization-response.dto';
import { OrganizationDashboardSummaryDto } from '../models/organization-dashboard-summary.dto';
import { OrganizationRecentDto } from '../models/organization-recent.dto';
import { OrganizationCountDto } from '../models/organization-count.dto';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/organizations`;

  /**
   * Sends a POST request to create a new organization.
   * Endpoint: POST /api/organizations
   */
  createOrganization(request: CreateOrganizationDto): Observable<OrganizationResponseDto> {
    return this.http.post<OrganizationResponseDto>(this.apiUrl, request);
  }

  /**
   * Retrieves dashboard summary statistics.
   * Endpoint: GET /api/organizations/dashboard-summary
   */
  getDashboardSummary(): Observable<OrganizationDashboardSummaryDto> {
    return this.http.get<OrganizationDashboardSummaryDto>(`${this.apiUrl}/dashboard-summary`);
  }

  /**
   * Retrieves recent organizations.
   * Endpoint: GET /api/organizations/recent
   */
  getRecentOrganizations(): Observable<OrganizationRecentDto[]> {
    return this.http.get<OrganizationRecentDto[]>(`${this.apiUrl}/recent`);
  }

  /**
   * Retrieves total organization count.
   * Endpoint: GET /api/organizations/count
   */
  getOrganizationsCount(): Observable<OrganizationCountDto | number> {
    return this.http.get<OrganizationCountDto | number>(`${this.apiUrl}/count`);
  }
}
