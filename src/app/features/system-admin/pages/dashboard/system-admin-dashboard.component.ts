import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { OrganizationDashboardSummaryDto } from '../../../organizations/models/organization-dashboard-summary.dto';
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
export class SystemAdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly organizationService = inject(OrganizationService);
  private readonly data = inject(SystemAdminDataService);

  readonly summaryData = signal<OrganizationDashboardSummaryDto | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);

  // Fallback to local data service stats if API call fails, or map real API data
  readonly stats = computed(() => {
    const summary = this.summaryData();
    console.log(summary);
    if (summary) {
      return {
        totalCenters: summary.totalCenters,
        
        activeCenters: summary.activeCenters,
        pendingCenters: summary.pendingCenters,
        totalManagers: summary.totalManagers,
        totalEmployees: summary.totalEmployees,
        newCentersThisMonth: summary.newCentersThisMonth,
      };
    }
    return this.data.stats();
  });

  readonly recentCenters = computed(() => this.data.getRecentCenters(3));
  readonly recentActivity = computed(() => this.data.getRecentActivity(3));

  readonly userDetails = this.authService.userDetails;

  readonly userGreetingName = computed(() => {
    const user = this.userDetails();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName.trim()} ${user.lastName.trim()}`;
    }
    if (user && user.firstName) {
      return user.firstName.trim();
    }
    return 'مدیر سیستم';
  });

  readonly avatarInitial = computed(() => {
    const user = this.userDetails();
    if (user && user.firstName) {
      return user.firstName.trim().charAt(0);
    }
    return 'م';
  });

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe();
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.organizationService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summaryData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load organization dashboard summary:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

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
