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
    const formData = new FormData();
    formData.append('firstName', request.firstName);
    formData.append('lastName', request.lastName);
    formData.append('phoneNumber', request.phoneNumber);
    if (request.email) formData.append('email', request.email);
    formData.append('personnelCode', request.personnelCode);
    formData.append('nationalCode', request.nationalCode);
    formData.append('birthDate', request.birthDate);
    formData.append('hireDate', request.hireDate);
    if (request.gender) formData.append('gender', request.gender);
    formData.append('organizationId', request.organizationId);

    if (request.profileImage) {
      formData.append('profileImage', request.profileImage);
    }

    return this.http.post<EmployeeResponseDto>(
      this.orgEmployeesUrl,
      formData
    );
  }

  updateEmployee(id: string, request: UpdateEmployeeDto): Observable<EmployeeResponseDto> {
    const formData = new FormData();
    formData.append('organizationId', request.organizationId);
    formData.append('personnelCode', request.personnelCode);
    formData.append('nationalCode', request.nationalCode);
    formData.append('birthDate', request.birthDate);
    if (request.gender) formData.append('gender', request.gender);
    formData.append('hireDate', request.hireDate);
    formData.append('isActive', String(request.isActive));

    if (request.removeProfileImage !== undefined) {
      formData.append('removeProfileImage', String(request.removeProfileImage));
    }

    if (request.profileImage) {
      formData.append('profileImage', request.profileImage);
    }

    return this.http.put<EmployeeResponseDto>(`${this.apiUrl}/${id}`, formData);
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
