import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateOrganizationDto } from '../models/create-organization.dto';
import { OrganizationResponseDto } from '../models/organization-response.dto';

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
}
