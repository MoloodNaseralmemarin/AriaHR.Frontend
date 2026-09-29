import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { EmployeeResponseDto } from '../models/employee-response.dto';
import { CreateEmployeeDto } from '../models/create-employee.dto';
import { UpdateEmployeeDto } from '../models/update-employee.dto';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/employees`;
  private readonly orgEmployeesUrl = `${environment.apiUrl}/api/organizations/employees`;

  getEmployees(): Observable<EmployeeResponseDto[]> {
    return this.http.get<EmployeeResponseDto[]>(this.orgEmployeesUrl);
  }

  getEmployeeById(id: string): Observable<EmployeeResponseDto> {
    return this.http.get<EmployeeResponseDto>(`${this.apiUrl}/${id}`);
  }

  createEmployee(request: CreateEmployeeDto): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(
      this.orgEmployeesUrl,
      request
    );
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
