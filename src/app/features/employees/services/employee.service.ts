import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { EmployeeResponseDto } from '../models/employee-response.dto';
import { CreateEmployeeDto } from '../models/create-employee.dto';
import { UpdateEmployeeDto } from '../models/update-employee.dto';
import { PagedResponseDto } from '../../../shared/models/paged-response.dto';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/employees`;

  getEmployees(
    pageNumber = 1,
    pageSize = 10,
    search?: string,
    organizationId?: string
  ): Observable<PagedResponseDto<EmployeeResponseDto>> {
    let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (organizationId) {
      url += `&organizationId=${encodeURIComponent(organizationId)}`;
    }
    return this.http.get<PagedResponseDto<EmployeeResponseDto>>(url);
  }

  getEmployeeById(id: string): Observable<EmployeeResponseDto> {
    return this.http.get<EmployeeResponseDto>(`${this.apiUrl}/${id}`);
  }

  createEmployee(request: CreateEmployeeDto): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(this.apiUrl, request);
  }

  updateEmployee(id: string, request: UpdateEmployeeDto): Observable<EmployeeResponseDto> {
    return this.http.put<EmployeeResponseDto>(`${this.apiUrl}/${id}`, request);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activateEmployee(id: string): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateEmployee(id: string): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
