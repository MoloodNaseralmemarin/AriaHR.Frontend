import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateWorkLocationDto } from '../models/create-work-location.dto';
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
   * Posts the creation request for a new work location.
   * Endpoint: POST /api/organizations/work-locations
   */
  createWorkLocation(request: CreateWorkLocationDto): Observable<WorkLocationResponseDto> {
    return this.http.post<WorkLocationResponseDto>(this.apiUrl, request);
  }

  /**
   * Fetches reverse geocoded address for coordinates using Neshan API.
   */
  reverseGeocode(lat: number, lng: number): Observable<string | null> {
    const apiKey = environment.neshanServiceApiKey;
    if (!apiKey) {
      return of(null);
    }

    const url = `https://api.neshan.org/v2/reverse?lat=${lat}&lng=${lng}`;
    const headers = new HttpHeaders({
      'Api-Key': apiKey,
    });

    return this.http.get<NeshanReverseGeocodeResponse>(url, { headers }).pipe(
      map((res) => {
        if (res.formatted_address) {
          return res.formatted_address;
        }
        if (res.address) {
          return res.address;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }
}
