import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RecentActivityDto } from '../models/recent-activity.dto';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard`;

  /**
   * Fetches recent system activities.
   * Endpoint: GET /api/dashboard/recent-activities
   */
  getRecentActivities(): Observable<RecentActivityDto[]> {
    return this.http.get<RecentActivityDto[]>(`${this.apiUrl}/recent-activities`);
  }
}
