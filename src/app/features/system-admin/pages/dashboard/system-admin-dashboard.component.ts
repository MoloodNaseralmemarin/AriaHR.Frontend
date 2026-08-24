import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterStatus, SystemActivity } from '../../models/system-admin.models';

@Component({
  selector: 'app-system-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './system-admin-dashboard.component.html',
  styleUrl: './system-admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminDashboardComponent {
  private readonly data = inject(SystemAdminDataService);
  readonly stats = this.data.stats;
  readonly recentCenters = computed(() => this.data.getRecentCenters(3));
  readonly recentActivity = computed(() => this.data.getRecentActivity(3));

  getStatusLabel(status: CenterStatus): string {
    return status === 'active' ? 'فعال' : status === 'pending' ? 'در انتظار تکمیل' : 'غیرفعال';
  }

  getStatusClass(status: CenterStatus): string {
    return `status-${status}`;
  }

  getActivityClass(activity: SystemActivity): string {
    return activity.type === 'center_deactivated' ? 'activity-danger' : activity.type === 'manager_created' ? 'activity-info' : 'activity-success';
  }

  getRelativeTime(timestamp: string): string {
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ساعت پیش`;
  }
}
