import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DashboardOverviewResponse } from '../models/dashboard-overview.dto';
import { RecentActivityDto } from '../models/recent-activity.dto';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard`;

  /**
   * Fetches dashboard overview statistics.
   * Endpoint: GET /api/dashboard/overview
   */
  getOverview(): Observable<DashboardOverviewResponse> {
    return this.http.get<DashboardOverviewResponse>(`${this.apiUrl}/overview`);
  }

  /**
   * Fetches recent system activities.
   * Endpoint: GET /api/dashboard/recent-activities
   */
  getRecentActivities(): Observable<RecentActivityDto[]> {
    return this.http.get<RecentActivityDto[]>(`${this.apiUrl}/recent-activities`);
  }
}
