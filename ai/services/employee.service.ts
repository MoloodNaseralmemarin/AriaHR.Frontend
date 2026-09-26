import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// GUESS — تأیید نشده: مسیر environment طبق ساختار پیش‌فرض Angular CLI
// (src/environments/environment.ts) فرض شده. اگر پروژه از یک TypeScript
// path alias استفاده می‌کند (طبق بند ۲۷ استاندارد)، این ایمپورت را با همان
// alias جایگزین کنید.
import { environment } from '../../../../environments/environment';

import { EmployeeResponseDto } from '../models/employee-response.dto';
import { CreateEmployeeDto } from '../models/create-employee.dto';
import { UpdateEmployeeDto } from '../models/update-employee.dto';
import { PagedResponseDto } from '../../../shared/models/paged-response.dto';

/**
 * EmployeeService
 *
 * طبق بند ۹ و ۱۸ استاندارد (00-ARIAHR_ANGULAR_API_STANDARD.md) ساخته شده:
 * - نام‌گذاری [Feature]Service
 * - inject() به‌جای DI مبتنی بر سازنده
 * - providedIn: 'root'
 * - Observable های تایپ‌شده (بدون any)
 *
 * ⚠️ GUESS — تأیید نشده (چون کنترلر واقعی بک‌اند دیده نشده):
 * - مسیر پایه‌ی endpoint: `${environment.apiUrl}/employees`
 * - نام query paramها برای صفحه‌بندی/جستجو: pageNumber, pageSize, search
 * - وجود endpoint های activate/deactivate با متد POST
 * - عدم وجود envelope عمومی (ApiResponseDto) دور پاسخ‌ها؛ اگر بک‌اند از
 *   envelope استفاده می‌کند (طبق بند ۲۰ استاندارد)، امضای متدها باید به
 *   Observable<ApiResponseDto<...>> تغییر کند.
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/employees`;

  getEmployees(
    pageNumber = 1,
    pageSize = 10,
    search?: string
  ): Observable<PagedResponseDto<EmployeeResponseDto>> {
    let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
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

  // GUESS — تأیید نشده: این دو متد فرض می‌کنند بک‌اند به‌جای PUT کامل، یک
  // اکشن اختصاصی برای تغییر IsActive دارد. اگر چنین endpointی وجود ندارد،
  // به‌جایش باید از updateEmployee با isActive جدید استفاده شود.
  activateEmployee(id: string): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateEmployee(id: string): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
