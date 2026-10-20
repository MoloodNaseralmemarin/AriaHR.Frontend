import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent, BadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { RecentOrganizationDto } from '../../../organizations/models/recent-organization.dto';
import { getOrganizationTypeLabel } from '../../../organizations/models/organization-type.enum';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardOverviewResponse } from '../../models/dashboard-overview.dto';
import { RecentActivityDto } from '../../models/recent-activity.dto';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterStatus, SystemActivity } from '../../models/system-admin.models';

export interface UIRecentOrganization {
  id: string | number;
  name: string;
  typeLabel: string;
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
  imports: [
    CommonModule,
    RouterLink,
    SummaryCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './system-admin-dashboard.component.html',
  styleUrl: './system-admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminDashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly organizationService = inject(OrganizationService);
  private readonly dashboardService = inject(DashboardService);
  private readonly data = inject(SystemAdminDataService);
  private readonly persianDateService = inject(PersianDateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly todayFormattedDate = this.persianDateService.getTodayFormatted();

  /** Signal updated every 30 seconds to trigger relative time recalculation without API requests */
  readonly now = signal<Date>(new Date());
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly overviewData = signal<DashboardOverviewResponse | null>(null);
  readonly isLoadingOverview = signal<boolean>(true);
  readonly overviewError = signal<boolean>(false);

  readonly recentOrgsRaw = signal<RecentOrganizationDto[] | null>(null);
  readonly isLoadingRecentOrgs = signal<boolean>(true);
  readonly recentOrgsError = signal<boolean>(false);

  readonly recentActivitiesRaw = signal<RecentActivityDto[] | null>(null);
  readonly isLoadingRecentActivities = signal<boolean>(true);
  readonly recentActivitiesError = signal<boolean>(false);

  readonly recentCenters = computed<UIRecentOrganization[]>(() => {
    const rawList = this.recentOrgsRaw();
    if (rawList !== null) {
      return rawList.map((item) => {
        const id = item.id ?? item.Id ?? '';
        const name = item.name ?? item.Name ?? '';
        const typeNum = item.type ?? item.Type;
        const typeLabel = getOrganizationTypeLabel(typeNum);
        const firstName = item.managerFirstName ?? item.ManagerFirstName ?? '';
        const lastName = item.managerLastName ?? item.ManagerLastName ?? '';
        const managerName = `${firstName} ${lastName}`.trim() || 'نامشخص';
        const isActive = item.isActive ?? item.IsActive ?? true;
        const status: CenterStatus = isActive ? 'active' : 'inactive';

        return { id, name, typeLabel, managerName, status };
      });
    }

    // Fallback to local mock service if API failed
    if (this.recentOrgsError()) {
      return this.data.getRecentCenters(3).map((c) => ({
        id: c.id,
        name: c.name,
        typeLabel: 'کلینیک',
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
    this.loadDashboardOverview();
    this.loadRecentOrganizations();
    this.loadRecentActivities();

    this.timerId = setInterval(() => {
      this.now.set(new Date());
    }, 30000);

    this.destroyRef.onDestroy(() => {
      this.clearTimer();
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  loadDashboardOverview(): void {
    this.isLoadingOverview.set(true);
    this.overviewError.set(false);

    this.dashboardService.getOverview().subscribe({
      next: (data) => {
        this.overviewData.set(data);
        this.isLoadingOverview.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard overview:', err);
        this.overviewError.set(true);
        this.isLoadingOverview.set(false);
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

  getStatusTone(status: CenterStatus): BadgeTone {
    return status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'danger';
  }

  getActivityClass(activity: UIRecentActivity | SystemActivity): string {
    return activity.type === 'center_deactivated' ? 'bg-rose-500 ring-rose-200' : activity.type === 'manager_created' ? 'bg-sky-500 ring-sky-200' : 'bg-emerald-500 ring-emerald-200';
  }

  getRelativeTime(timestamp: string): string {
    return this.persianDateService.getRelativeTime(timestamp, this.now());
  }
}
