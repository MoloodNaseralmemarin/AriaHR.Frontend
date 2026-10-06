import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { LeaveCategoryDto } from '../models/leave-category.dto';
import { CreateLeaveCategoryDto } from '../models/create-leave-category.dto';
import { UpdateLeaveCategoryDto } from '../models/update-leave-category.dto';

/**
 * Feature API service for managing organization Leave Categories.
 * Strictly follows ARIAHR Angular API Integration Standard.
 */
@Injectable({
  providedIn: 'root',
})
export class LeaveCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/leave-categories`;

  /** Retrieves all leave categories for the authenticated organization. */
  getAll(): Observable<LeaveCategoryDto[]> {
    return this.http.get<LeaveCategoryDto[]>(`${environment.apiUrl}/api/requests/leave-categories`);
  }

  /** Retrieves a specific leave category by ID. */
  getById(id: string): Observable<LeaveCategoryDto> {
    return this.http.get<LeaveCategoryDto>(`${this.apiUrl}/${id}`);
  }

  /** Creates a new leave category. */
  create(request: CreateLeaveCategoryDto): Observable<LeaveCategoryDto> {
    return this.http.post<LeaveCategoryDto>(this.apiUrl, request);
  }

  /** Updates an existing leave category. */
  update(id: string, request: UpdateLeaveCategoryDto): Observable<LeaveCategoryDto> {
    return this.http.put<LeaveCategoryDto>(`${this.apiUrl}/${id}`, request);
  }

  /** Activates a leave category. */
  activate(id: string): Observable<LeaveCategoryDto> {
    return this.http.patch<LeaveCategoryDto>(`${this.apiUrl}/${id}/activate`, null);
  }

  /** Deactivates a leave category. */
  deactivate(id: string): Observable<LeaveCategoryDto> {
    return this.http.patch<LeaveCategoryDto>(`${this.apiUrl}/${id}/deactivate`, null);
  }
}
