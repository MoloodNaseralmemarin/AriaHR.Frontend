import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateWorkLocationDto } from '../models/create-work-location.dto';
import {
  QrCodeResponse,
  QrCodeSettingsDto,
  UpdateQrCodeSettingsDto,
} from '../models/qr-code-response.dto';
import { UpdateWorkLocationDto } from '../models/update-work-location.dto';
import {
  NeshanReverseGeocodeResponse,
  WorkLocationDto,
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

  /** POST /api/organizations/work-locations */
  createWorkLocation(request: CreateWorkLocationDto): Observable<WorkLocationDto> {
    return this.http.post<WorkLocationDto>(this.apiUrl, request);
  }

  /** GET /api/organizations/work-locations/{id} */
  getWorkLocationById(id: string): Observable<WorkLocationDto> {
    return this.http.get<WorkLocationDto>(`${this.apiUrl}/${id}`);
  }

  /** GET /api/organizations/work-locations */
  getWorkLocations(): Observable<WorkLocationDto[]> {
    return this.http.get<WorkLocationDto[]>(this.apiUrl);
  }

  /** PUT /api/organizations/work-locations/{id} */
  updateWorkLocation(id: string, request: UpdateWorkLocationDto): Observable<WorkLocationDto> {
    return this.http.put<WorkLocationDto>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Generates a signed QR token (or refreshes the current one).
   * POST /api/organizations/work-locations/{id}/qrcode/generate
   */
  generateQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(
      `${this.apiUrl}/${workLocationId}/qrcode/generate`,
      null
    );
  }

  /** GET /api/organizations/work-locations/{id}/qrcode/current */
  getCurrentQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.get<QrCodeResponse>(`${this.apiUrl}/${workLocationId}/qrcode/current`);
  }

  /** GET /api/organizations/work-locations/{id}/qrcode/settings */
  getQrCodeSettings(workLocationId: string): Observable<QrCodeSettingsDto> {
    return this.http.get<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/settings`
    );
  }

  /** PUT /api/organizations/work-locations/{id}/qrcode/settings */
  updateQrCodeSettings(
    workLocationId: string,
    request: UpdateQrCodeSettingsDto
  ): Observable<QrCodeSettingsDto> {
    return this.http.put<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/settings`,
      request
    );
  }

  /** POST /api/organizations/work-locations/{id}/qrcode/enable */
  enableQrCode(workLocationId: string): Observable<QrCodeSettingsDto> {
    return this.http.post<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/enable`,
      null
    );
  }

  /** POST /api/organizations/work-locations/{id}/qrcode/disable */
  disableQrCode(workLocationId: string): Observable<QrCodeSettingsDto> {
    return this.http.post<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/disable`,
      null
    );
  }

  /** POST /api/organizations/work-locations/{id}/qrcode/revoke */
  revokeQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(
      `${this.apiUrl}/${workLocationId}/qrcode/revoke`,
      null
    );
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
