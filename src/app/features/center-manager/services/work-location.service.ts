import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateWorkLocationDto } from '../models/create-work-location.dto';
import { QrCodeResponse } from '../models/qr-code-response.dto';
import {
  QrCodeSettingsDto,
  UpdateQrCodeSettingsDto,
} from '../models/qr-code-settings.dto';
import { UpdateWorkLocationDto } from '../models/update-work-location.dto';
import {
  NeshanReverseGeocodeResponse,
  WorkLocationResponseDto,
} from '../models/work-location-response.dto';
import { ReverseGeocodeError, toReverseGeocodeFailure } from '../utils/reverse-geocode.util';

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

@Injectable({
  providedIn: 'root',
})
export class WorkLocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/WorkLocations/work-locations`;

  /**
   * Neshan reverse geocoding requires a dedicated "Services" key (Reverse Geocoding
   * service). A Web Map key is rejected with HTTP 483 ("API Key type not suitable for
   * this service"), so the map key must never be used here.
   */
  get hasReverseGeocodingKey(): boolean {
    return !!environment.neshanServiceApiKey;
  }

  /**
   * Creates a new work location for the authenticated organization.
   * POST /api/WorkLocations/work-locations
   */
  createWorkLocation(request: CreateWorkLocationDto): Observable<WorkLocationResponseDto> {
    return this.http.post<WorkLocationResponseDto>(this.apiUrl, request);
  }

  /**
   * Retrieves a work location by its ID.
   * GET /api/WorkLocations/work-locations/{id}
   */
  getWorkLocationById(id: string): Observable<WorkLocationResponseDto> {
    return this.http.get<WorkLocationResponseDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves all work locations of the authenticated organization.
   * A SystemAdmin must pass `organizationId`.
   * GET /api/WorkLocations/work-locations?organizationId=
   */
  getWorkLocations(organizationId?: string): Observable<WorkLocationResponseDto[]> {
    let params = new HttpParams();
    if (organizationId) {
      params = params.set('organizationId', organizationId);
    }

    return this.http.get<WorkLocationResponseDto[]>(this.apiUrl, { params });
  }

  /**
   * Updates an existing work location.
   * PUT /api/WorkLocations/work-locations/{id}
   */
  updateWorkLocation(
    id: string,
    request: UpdateWorkLocationDto
  ): Observable<WorkLocationResponseDto> {
    return this.http.put<WorkLocationResponseDto>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Returns the current signed QR token of a work location.
   * GET /api/WorkLocations/work-locations/{id}/qrcode/current
   */
  getCurrentQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.get<QrCodeResponse>(`${this.apiUrl}/${workLocationId}/qrcode/current`);
  }

  /**
   * Generates a fresh signed QR token.
   * POST /api/WorkLocations/work-locations/{id}/qrcode/generate
   */
  generateQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(
      `${this.apiUrl}/${workLocationId}/qrcode/generate`,
      null
    );
  }

  /**
   * Reads the QR configuration of a work location.
   * GET /api/WorkLocations/work-locations/{id}/qrcode/settings
   */
  getQrCodeSettings(workLocationId: string): Observable<QrCodeSettingsDto> {
    return this.http.get<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/settings`
    );
  }

  /**
   * Updates the QR configuration (mode / rotation interval).
   * PUT /api/WorkLocations/work-locations/{id}/qrcode/settings
   */
  updateQrCodeSettings(
    workLocationId: string,
    request: UpdateQrCodeSettingsDto
  ): Observable<QrCodeSettingsDto> {
    return this.http.put<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/settings`,
      request
    );
  }

  /**
   * Enables QR attendance for a work location.
   * POST /api/WorkLocations/work-locations/{id}/qrcode/enable
   */
  enableQrCode(workLocationId: string): Observable<QrCodeSettingsDto> {
    return this.http.post<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/enable`,
      null
    );
  }

  /**
   * Disables QR attendance for a work location.
   * POST /api/WorkLocations/work-locations/{id}/qrcode/disable
   */
  disableQrCode(workLocationId: string): Observable<QrCodeSettingsDto> {
    return this.http.post<QrCodeSettingsDto>(
      `${this.apiUrl}/${workLocationId}/qrcode/disable`,
      null
    );
  }

  /**
   * Revokes the current QR token and issues a new one, invalidating the old code.
   * POST /api/WorkLocations/work-locations/{id}/qrcode/revoke
   */
  revokeQrCode(workLocationId: string): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(
      `${this.apiUrl}/${workLocationId}/qrcode/revoke`,
      null
    );
  }

  /**
   * Converts coordinates into a readable Persian address using Neshan Reverse
   * Geocoding v5 (`GET /v5/reverse?lat=…&lng=…` with the `Api-Key` header).
   *
   * Resolves with `null` only when Neshan answered successfully but the point
   * has no address. Every other failure is reported as a `ReverseGeocodeError`
   * with the Neshan code, so the UI can explain the real cause (a rejected key
   * type, a domain outside the key scope, exhausted quota, a network failure, …)
   * instead of silently pretending no address exists.
   */
  reverseGeocode(lat: number, lng: number): Observable<string | null> {
    if (!isValidCoordinate(lat, lng)) {
      return throwError(
        () =>
          new ReverseGeocodeError({
            reason: 'invalid-coordinates',
            code: null,
            detail: `lat=${lat}, lng=${lng}`,
          })
      );
    }

    const apiKey = environment.neshanServiceApiKey;
    if (!apiKey) {
      return throwError(
        () => new ReverseGeocodeError({ reason: 'not-configured', code: null, detail: null })
      );
    }

    const url = `https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`;
    const headers = new HttpHeaders({
      'Api-Key': apiKey,
    });

    return this.http.get<NeshanReverseGeocodeResponse>(url, { headers }).pipe(
      map((res) => this.toReadableAddress(res)),
      catchError((error: unknown) =>
        throwError(() => new ReverseGeocodeError(toReverseGeocodeFailure(error)))
      )
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
