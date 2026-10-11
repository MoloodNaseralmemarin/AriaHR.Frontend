import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ShiftDto } from '../models/shift.dto';
import { CreateShiftDto } from '../models/create-shift.dto';
import { UpdateShiftDto } from '../models/update-shift.dto';

/**
 * Feature API service for Center Manager shift operations.
 *
 * Strictly follows ARIAHR_ANGULAR_API_STANDARD.md: components must never call
 * HttpClient directly — this service is the single authoritative entry point.
 */
@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/scheduling/shifts`;

  /** Retrieves all shift definitions for the authenticated organization. */
  getShifts(): Observable<ShiftDto[]> {
    return this.http.get<ShiftDto[]>(this.apiUrl);
  }

  /** Retrieves a specific shift definition by ID. */
  getShiftById(id: string): Observable<ShiftDto> {
    return this.http.get<ShiftDto>(`${this.apiUrl}/${id}`);
  }

  /** Creates a new shift definition. */
  createShift(request: CreateShiftDto): Observable<ShiftDto> {
    return this.http.post<ShiftDto>(this.apiUrl, request);
  }

  /** Updates an existing shift definition. */
  updateShift(id: string, request: UpdateShiftDto): Observable<ShiftDto> {
    return this.http.put<ShiftDto>(`${this.apiUrl}/${id}`, request);
  }

  /** Activates a shift definition. */
  activateShift(id: string): Observable<ShiftDto> {
    return this.http.patch<ShiftDto>(`${this.apiUrl}/${id}/activate`, null);
  }

  /** Deactivates a shift definition. */
  deactivateShift(id: string): Observable<ShiftDto> {
    return this.http.patch<ShiftDto>(`${this.apiUrl}/${id}/deactivate`, null);
  }
}
