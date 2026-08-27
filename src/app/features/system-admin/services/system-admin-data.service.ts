import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import {
  Center,
  CenterManager,
  CreateCenterPayload,
  SystemActivity,
  SystemAdminStats,
} from '../models/system-admin.models';

/**
 * Mock data source for the System Admin dashboard.
 *
 * All data is static/hardcoded for now. When real APIs are available, swap the
 * method bodies for HTTP calls — the signal shapes and method signatures are
 * already shaped for that swap.
 */
@Injectable({ providedIn: 'root' })
export class SystemAdminDataService {
  private readonly _stats = signal<SystemAdminStats>({
    totalCenters: 24,
    activeCenters: 22,
    pendingCenters: 2,
    totalManagers: 26,
    totalEmployees: 342,
    newCentersThisMonth: 2,
  });

  private readonly _centers = signal<Center[]>([
    {
      id: 'c1',
      name: 'مرکز تصویربرداری پارس',
      managerName: 'دکتر احمدی',
      employeeCount: 32,
      status: 'active',
      createdAt: '2026-08-20T08:30:00Z',
      attendanceToday: 87,
      shiftCount: 4,
      pendingRequests: 3,
    },
    {
      id: 'c2',
      name: 'کلینیک آریا',
      managerName: 'سارا محمدی',
      employeeCount: 18,
      status: 'active',
      createdAt: '2026-08-24T06:00:00Z',
      attendanceToday: 92,
      shiftCount: 3,
      pendingRequests: 1,
    },
    {
      id: 'c3',
      name: 'مرکز پزشکی نوین',
      managerName: 'علی رضایی',
      employeeCount: 0,
      status: 'pending',
      createdAt: '2026-08-23T10:15:00Z',
      attendanceToday: 0,
      shiftCount: 0,
      pendingRequests: 0,
    },
    {
      id: 'c4',
      name: 'مرکز تصویربرداری X',
      managerName: 'دکتر کریمی',
      employeeCount: 12,
      status: 'inactive',
      createdAt: '2026-07-15T09:00:00Z',
      attendanceToday: 0,
      shiftCount: 2,
      pendingRequests: 0,
    },
    {
      id: 'c5',
      name: 'کلینیک تخصصی شفا',
      managerName: 'دکتر موسوی',
      employeeCount: 45,
      status: 'active',
      createdAt: '2026-08-21T07:45:00Z',
      attendanceToday: 78,
      shiftCount: 5,
      pendingRequests: 2,
    },
  ]);

  private readonly _managers = signal<CenterManager[]>([
    {
      id: 'm1',
      name: 'دکتر احمدی',
      centerName: 'مرکز تصویربرداری پارس',
      mobileNumber: '09121234567',
      createdAt: '2026-08-20T08:30:00Z',
      active: true,
    },
    {
      id: 'm2',
      name: 'سارا محمدی',
      centerName: 'کلینیک آریا',
      mobileNumber: '09127654321',
      createdAt: '2026-08-24T06:00:00Z',
      active: true,
    },
    {
      id: 'm3',
      name: 'علی رضایی',
      centerName: 'مرکز پزشکی نوین',
      mobileNumber: '09131112233',
      createdAt: '2026-08-23T10:15:00Z',
      active: false,
    },
    {
      id: 'm4',
      name: 'دکتر کریمی',
      centerName: 'مرکز تصویربرداری X',
      mobileNumber: '09144445566',
      createdAt: '2026-07-15T09:00:00Z',
      active: false,
    },
    {
      id: 'm5',
      name: 'دکتر موسوی',
      centerName: 'کلینیک تخصصی شفا',
      mobileNumber: '09157778899',
      createdAt: '2026-08-21T07:45:00Z',
      active: true,
    },
  ]);

  private readonly _activity = signal<SystemActivity[]>([
    {
      id: 'a1',
      type: 'center_created',
      label: 'مرکز جدید ثبت شد',
      detail: 'کلینیک آریا',
      timestamp: '2026-08-24T06:00:00Z',
    },
    {
      id: 'a2',
      type: 'manager_created',
      label: 'مدیر مرکز ایجاد شد',
      detail: 'دکتر احمدی',
      timestamp: '2026-08-24T05:00:00Z',
    },
    {
      id: 'a3',
      type: 'center_deactivated',
      label: 'مرکز غیرفعال شد',
      detail: 'مرکز تصویربرداری X',
      timestamp: '2026-08-24T02:00:00Z',
    },
    {
      id: 'a4',
      type: 'center_created',
      label: 'مرکز جدید ثبت شد',
      detail: 'کلینیک تخصصی شفا',
      timestamp: '2026-08-21T07:45:00Z',
    },
  ]);

  readonly stats = this._stats.asReadonly();
  readonly centers = this._centers.asReadonly();
  readonly managers = this._managers.asReadonly();
  readonly activity = this._activity.asReadonly();

  getCenterById(id: string): Center | undefined {
    return this._centers().find((c) => c.id === id);
  }

  getRecentCenters(count: number): Center[] {
    return [...this._centers()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count);
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
