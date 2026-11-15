import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateWorkLocationDto } from '../models/create-work-location.dto';
import { QrCodeResponse } from '../models/qr-code-response.dto';
import {
  NeshanReverseGeocodeResponse,
  WorkLocationResponseDto,
} from '../models/work-location-response.dto';

@Injectable({
  providedIn: 'root',
})
export class WorkLocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/organizations/work-locations`;

  /**
   * Neshan reverse geocoding requires a dedicated "Services" key (Reverse Geocoding
   * service). A Web Map key is rejected with HTTP 483 ("API Key type not suitable for
   * this service"), so the map key must never be used here.
   */
  get hasReverseGeocodingKey(): boolean {
    return !!environment.neshanServiceApiKey;
  }

  /**
   * Posts the creation request for a new work location.
   * Endpoint: POST /api/organizations/work-locations
   */
  createWorkLocation(request: CreateWorkLocationDto): Observable<WorkLocationResponseDto> {
    return this.http.post<WorkLocationResponseDto>(this.apiUrl, request);
  }

  /**
   * Retrieves a work location by its ID.
   * Endpoint: GET /api/organizations/work-locations/{id}
   */
  getWorkLocationById(id: string): Observable<WorkLocationResponseDto> {
    return this.http.get<WorkLocationResponseDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves all work locations for the authenticated organization.
   * Endpoint: GET /api/organizations/work-locations
   */
  getWorkLocations(): Observable<WorkLocationResponseDto[]> {
    return this.http.get<WorkLocationResponseDto[]>(this.apiUrl);
  }

  /**
   * Updates an existing work location.
   * Endpoint: PUT /api/organizations/work-locations/{id}
   */
  updateWorkLocation(id: string, request: CreateWorkLocationDto): Observable<WorkLocationResponseDto> {
    return this.http.put<WorkLocationResponseDto>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Deletes a work location.
   * Endpoint: DELETE /api/organizations/work-locations/{id}
   */
  deleteWorkLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Generates a QR Code for an existing work location.
   * Endpoint: POST /api/organizations/work-locations/{workLocationId}/qr
   */
  generateQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(`${this.apiUrl}/${workLocationId}/qr`, null);
  }

  /**
   * Converts coordinates into a readable Persian address using Neshan Reverse
   * Geocoding v5. Returns `null` when no services key is configured, when the
   * coordinates cannot be resolved, or when the request fails.
   */
  reverseGeocode(lat: number, lng: number): Observable<string | null> {
    const apiKey = environment.neshanServiceApiKey;
    if (!apiKey) {
      return of(null);
    }

    const url = `https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`;
    const headers = new HttpHeaders({
      'Api-Key': apiKey,
    });

    return this.http.get<NeshanReverseGeocodeResponse>(url, { headers }).pipe(
      map((res) => this.toReadableAddress(res)),
      catchError(() => of(null))
    );
  }

  private toReadableAddress(res: NeshanReverseGeocodeResponse | null | undefined): string | null {
    const formatted = res?.formatted_address?.trim();
    if (formatted) {
      return formatted;
    }

    const parts = [res?.neighbourhood, res?.city, res?.state]
      .map((part) => part?.trim())
      .filter((part): part is string => !!part);

    if (parts.length > 0) {
      return Array.from(new Set(parts)).join('، ');
    }

    const legacyAddress = res?.address?.trim();
    return legacyAddress || null;
  }
}
