import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, delay, catchError, map, tap } from 'rxjs';

import { OrganizationService } from '../../organizations/services/organization.service';
import { OrganizationDashboardSummaryDto } from '../../organizations/models/organization-dashboard-summary.dto';
import { OrganizationRecentDto } from '../../organizations/models/organization-recent.dto';
import {
  Center,
  CenterManager,
  CreateCenterPayload,
  SystemActivity,
  SystemAdminStats,
} from '../models/system-admin.models';

@Injectable({ providedIn: 'root' })
export class SystemAdminDataService {
  private readonly organizationService = inject(OrganizationService);

  private readonly _stats = signal<SystemAdminStats>({
    totalCenters: 0,
    activeCenters: 0,
    pendingCenters: 0,
    totalManagers: 0,
    totalEmployees: 0,
    newCentersThisMonth: 0,
  });

  private readonly _statsLoading = signal<boolean>(false);
  private readonly _statsError = signal<string | null>(null);

  private readonly _recentOrganizations = signal<OrganizationRecentDto[]>([]);
  private readonly _recentOrganizationsLoading = signal<boolean>(false);
  private readonly _recentOrganizationsError = signal<string | null>(null);

  private readonly _centers = signal<Center[]>([]);

  private readonly _managers = signal<CenterManager[]>([]);

  private readonly _activity = signal<SystemActivity[]>([]);

  readonly stats = this._stats.asReadonly();
  readonly statsLoading = this._statsLoading.asReadonly();
  readonly statsError = this._statsError.asReadonly();

  readonly recentOrganizations = this._recentOrganizations.asReadonly();
  readonly recentOrganizationsLoading = this._recentOrganizationsLoading.asReadonly();
  readonly recentOrganizationsError = this._recentOrganizationsError.asReadonly();

  readonly centers = this._centers.asReadonly();
  readonly managers = this._managers.asReadonly();
  readonly activity = this._activity.asReadonly();

  /** Loads summary statistics from backend API. */
  loadDashboardSummary(): Observable<OrganizationDashboardSummaryDto | null> {
    this._statsLoading.set(true);
    this._statsError.set(null);

    return this.organizationService.getDashboardSummary().pipe(
      tap((summary) => {
        this._stats.set({
          totalCenters: summary.totalCenters ?? 0,
          activeCenters: summary.activeCenters ?? 0,
          pendingCenters: summary.pendingCenters ?? 0,
          totalManagers: summary.totalManagers ?? 0,
          totalEmployees: summary.totalEmployees ?? 0,
          newCentersThisMonth: summary.newCentersThisMonth ?? 0,
        });
        this._statsLoading.set(false);
      }),
      catchError((err) => {
        this._statsError.set('خطا در دریافت آمار سامانه.');
        this._statsLoading.set(false);
        return of(null);
      })
    );
  }

  /** Loads recent organizations from backend API. */
  loadRecentOrganizations(): Observable<OrganizationRecentDto[]> {
    this._recentOrganizationsLoading.set(true);
    this._recentOrganizationsError.set(null);

    return this.organizationService.getRecentOrganizations().pipe(
      tap((list) => {
        const items = Array.isArray(list) ? list : [];
        this._recentOrganizations.set(items);
        this._recentOrganizationsLoading.set(false);

        // Map to internal Center models for backward compatibility if needed
        const mappedCenters: Center[] = items.map((org) => {
          const managerName =
            org.managerName ||
            (org.managerFirstName || org.managerLastName
              ? `${org.managerFirstName || ''} ${org.managerLastName || ''}`.trim()
              : 'نامشخص');
          const isAct = org.isActive !== undefined ? org.isActive : org.status === 'active';
          return {
            id: org.id,
            name: org.name,
            managerName,
            employeeCount: org.employeeCount ?? 0,
            status: isAct ? 'active' : org.status === 'pending' ? 'pending' : 'inactive',
            createdAt: org.createdAt || new Date().toISOString(),
            attendanceToday: 0,
            shiftCount: 0,
            pendingRequests: 0,
          };
        });
        this._centers.set(mappedCenters);
      }),
      catchError((err) => {
        this._recentOrganizationsError.set('خطا در دریافت لیست آخرین مراکز.');
        this._recentOrganizationsLoading.set(false);
        return of([]);
      })
    );
  }

  getCenterById(id: string): Center | undefined {
    return this._centers().find((c) => c.id === id);
  }

  getRecentCenters(count: number): Center[] {
    const list = this._centers();
    if (list.length > 0) {
      return [...list]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, count);
    }
    return [];
  }

  getRecentActivity(count: number): SystemActivity[] {
    return [...this._activity()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  /** Simulates creating a center + manager pair. */
  createCenter(payload: CreateCenterPayload): Observable<{ success: boolean; centerId: string }> {
    const managerFullName = `${payload.managerFirstName} ${payload.managerLastName}`.trim();
    const newCenter: Center = {
      id: 'c' + (this._centers().length + 1),
      name: payload.centerName,
      managerName: managerFullName,
      employeeCount: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attendanceToday: 0,
      shiftCount: 0,
      pendingRequests: 0,
    };

    this._centers.update((list) => [newCenter, ...list]);
    this._stats.update((s) => ({
      ...s,
      totalCenters: s.totalCenters + 1,
      pendingCenters: s.pendingCenters + 1,
      newCentersThisMonth: s.newCentersThisMonth + 1,
    }));

    return of({ success: true, centerId: newCenter.id }).pipe(delay(1200));
  }
}
