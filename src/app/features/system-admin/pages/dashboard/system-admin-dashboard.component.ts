import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { OrganizationDashboardSummaryDto } from '../../../organizations/models/organization-dashboard-summary.dto';
import { RecentOrganizationDto } from '../../../organizations/models/recent-organization.dto';
import { DashboardService } from '../../services/dashboard.service';
import { RecentActivityDto } from '../../models/recent-activity.dto';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterStatus, SystemActivity } from '../../models/system-admin.models';

export interface UIRecentOrganization {
  id: string | number;
  name: string;
  managerName: string;
  status: CenterStatus;
}

export interface UIRecentActivity {
  id: string | number;
  type: string;
  label: string;
  detail: string;
  timestamp: string;
}

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
  private readonly dashboardService = inject(DashboardService);
  private readonly data = inject(SystemAdminDataService);
  private readonly persianDateService = inject(PersianDateService);

  readonly todayFormattedDate = this.persianDateService.getTodayFormatted();

  readonly summaryData = signal<OrganizationDashboardSummaryDto | null>(null);
  readonly isLoadingSummary = signal<boolean>(true);
  readonly summaryError = signal<boolean>(false);

  readonly recentOrgsRaw = signal<RecentOrganizationDto[] | null>(null);
  readonly isLoadingRecentOrgs = signal<boolean>(true);
  readonly recentOrgsError = signal<boolean>(false);

  readonly recentActivitiesRaw = signal<RecentActivityDto[] | null>(null);
  readonly isLoadingRecentActivities = signal<boolean>(true);
  readonly recentActivitiesError = signal<boolean>(false);

  readonly stats = computed(() => {
    const summary = this.summaryData();
    if (summary) {
      return {
        totalCenters: summary.totalCenters ?? summary.TotalCenters ?? 0,
        activeCenters: summary.activeCenters ?? summary.ActiveCenters ?? 0,
        pendingCenters: summary.pendingCenters ?? summary.PendingCenters ?? 0,
        totalManagers: summary.totalManagers ?? summary.TotalManagers ?? 0,
        totalEmployees: summary.totalEmployees ?? summary.TotalEmployees ?? 0,
        newCentersThisMonth: summary.newCentersThisMonth ?? summary.NewCentersThisMonth ?? 0,
      };
    }
    return this.data.stats();
  });

  readonly recentCenters = computed<UIRecentOrganization[]>(() => {
    const rawList = this.recentOrgsRaw();
    if (rawList !== null) {
      return rawList.map((item) => {
        const id = item.id ?? item.Id ?? '';
        const name = item.name ?? item.Name ?? '';
        const firstName = item.managerFirstName ?? item.ManagerFirstName ?? '';
        const lastName = item.managerLastName ?? item.ManagerLastName ?? '';
        const managerName = `${firstName} ${lastName}`.trim() || 'نامشخص';
        const isActive = item.isActive ?? item.IsActive ?? true;
        const status: CenterStatus = isActive ? 'active' : 'inactive';

        return { id, name, managerName, status };
      });
    }

    // Fallback to local mock service if API failed
    if (this.recentOrgsError()) {
      return this.data.getRecentCenters(3).map((c) => ({
        id: c.id,
        name: c.name,
        managerName: c.managerName,
        status: c.status,
      }));
    }

    return [];
  });

  readonly recentActivity = computed<UIRecentActivity[]>(() => {
    const rawList = this.recentActivitiesRaw();
    if (rawList !== null) {
      return rawList.map((item) => {
        const id = item.id ?? item.Id ?? '';
        const label = item.label ?? item.Label ?? item.title ?? item.Title ?? 'فعالیت جدید';
        const detail = item.detail ?? item.Detail ?? item.description ?? item.Description ?? '';
        const type = item.type ?? item.Type ?? 'center_created';
        const timestamp = item.timestamp ?? item.Timestamp ?? item.createdAt ?? item.CreatedAt ?? new Date().toISOString();

        return { id, label, detail, type, timestamp };
      });
    }

    // Fallback to local mock service if API failed
    if (this.recentActivitiesError()) {
      return this.data.getRecentActivity(3).map((a) => ({
        id: a.id,
        label: a.label,
        detail: a.detail,
        type: a.type,
        timestamp: a.timestamp,
      }));
    }

    return [];
  });

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
    this.loadRecentOrganizations();
    this.loadRecentActivities();
  }

  loadDashboardSummary(): void {
    this.isLoadingSummary.set(true);
    this.summaryError.set(false);

    this.organizationService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summaryData.set(data);
        this.isLoadingSummary.set(false);
      },
      error: (err) => {
        console.error('Failed to load organization dashboard summary:', err);
        this.summaryError.set(true);
        this.isLoadingSummary.set(false);
      },
    });
  }

  loadRecentOrganizations(): void {
    this.isLoadingRecentOrgs.set(true);
    this.recentOrgsError.set(false);

    this.organizationService.getRecentOrganizations().subscribe({
      next: (data) => {
        this.recentOrgsRaw.set(data || []);
        this.isLoadingRecentOrgs.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent organizations:', err);
        this.recentOrgsError.set(true);
        this.isLoadingRecentOrgs.set(false);
      },
    });
  }

  loadRecentActivities(): void {
    this.isLoadingRecentActivities.set(true);
    this.recentActivitiesError.set(false);

    this.dashboardService.getRecentActivities().subscribe({
      next: (data) => {
        this.recentActivitiesRaw.set(data || []);
        this.isLoadingRecentActivities.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent activities:', err);
        this.recentActivitiesError.set(true);
        this.isLoadingRecentActivities.set(false);
      },
    });
  }

  getStatusLabel(status: CenterStatus): string {
    return status === 'active' ? 'فعال' : status === 'pending' ? 'در انتظار تکمیل' : 'غیرفعال';
  }

  getStatusClass(status: CenterStatus): string {
    return `status-${status}`;
  }

  getActivityClass(activity: UIRecentActivity | SystemActivity): string {
    return activity.type === 'center_deactivated' ? 'activity-danger' : activity.type === 'manager_created' ? 'activity-info' : 'activity-success';
  }

  getRelativeTime(timestamp: string): string {
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
    if (isNaN(minutes)) return 'لحظاتی پیش';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ساعت پیش`;
  }
}
