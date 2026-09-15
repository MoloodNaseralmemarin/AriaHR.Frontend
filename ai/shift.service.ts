import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateShiftDto } from '../models/create-shift.dto';
import { ShiftResponseDto } from '../models/shift-response.dto';

/**
 * Feature API service for Center Manager shift operations.
 * Endpoint path ('/shifts') is a placeholder — confirm against the real
 * Scheduling module route once available (see caveat in the DTO files).
 *
 * Per ARIAHR_ANGULAR_API_STANDARD.md: components must never call
 * HttpClient directly — this service is the only place that does.
 */
@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/shifts`;

  createShift(request: CreateShiftDto): Observable<ShiftResponseDto> {
    return this.http.post<ShiftResponseDto>(this.apiUrl, request);
  }
}
