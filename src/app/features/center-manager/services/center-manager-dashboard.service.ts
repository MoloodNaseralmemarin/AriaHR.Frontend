import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CenterManagerDashboardDto } from '../models/center-manager-dashboard.dto';

@Injectable({
  providedIn: 'root',
})
export class CenterManagerDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/center-manager/dashboard`;

  /**
   * Fetches metrics for the Center Manager Dashboard.
   * Endpoint: GET /api/center-manager/dashboard
   */
  getDashboardMetrics(): Observable<CenterManagerDashboardDto> {
    return this.http.get<CenterManagerDashboardDto>(this.apiUrl);
  }
}
