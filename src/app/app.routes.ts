import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { LoginPageComponent } from './features/auth/pages/login/login-page.component';
import { SplashComponent } from './features/auth/pages/splash/splash.component';
import { VerifyOtpPageComponent } from './features/auth/pages/verify-otp/verify-otp-page.component';

// System Admin Components
import { SystemAdminLayoutComponent } from './features/system-admin/layout/system-admin-layout.component';
import { SystemAdminDashboardComponent } from './features/system-admin/pages/dashboard/system-admin-dashboard.component';
import { SystemAdminCentersComponent } from './features/system-admin/pages/centers/system-admin-centers.component';
import { SystemAdminCenterDetailsComponent } from './features/system-admin/pages/center-details/system-admin-center-details.component';
import { SystemAdminCreateCenterComponent } from './features/system-admin/pages/create-center/system-admin-create-center.component';
import { SystemAdminManagersComponent } from './features/system-admin/pages/managers/system-admin-managers.component';
import { SystemAdminSettingsComponent } from './features/system-admin/pages/settings/system-admin-settings.component';

// Center Manager Components
import { CenterLayoutComponent } from './features/center-manager/layout/center-layout.component';
import { DashboardComponent as CenterManagerDashboardComponent } from './features/center-manager/pages/dashboard/dashboard.component';
import { EmployeesComponent as CenterManagerEmployeesComponent } from './features/center-manager/pages/employees/employees.component';
import { AttendanceComponent as CenterManagerAttendanceComponent } from './features/center-manager/pages/attendance/attendance.component';
import { ShiftsComponent as CenterManagerShiftsComponent } from './features/center-manager/pages/shifts/shifts.component';
import { RequestsComponent as CenterManagerRequestsComponent } from './features/center-manager/pages/requests/requests.component';
import { ReportsComponent as CenterManagerReportsComponent } from './features/center-manager/pages/reports/reports.component';
import { NotificationsComponent as CenterManagerNotificationsComponent } from './features/center-manager/pages/notifications/notifications.component';
import { SettingsComponent as CenterManagerSettingsComponent } from './features/center-manager/pages/settings/settings.component';

// Employee Components
import { EmployeeLayoutComponent } from './features/employee/layout/employee-layout.component';
import { EmployeeDashboardComponent } from './features/employee/pages/dashboard/employee-dashboard.component';
import { EmployeePlaceholderPageComponent } from './features/employee/pages/placeholder/employee-placeholder.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'verify-otp', component: VerifyOtpPageComponent },

  // SystemAdmin Routes
  {
    path: 'system-admin',
    component: SystemAdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'SystemAdmin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SystemAdminDashboardComponent },
      { path: 'centers', component: SystemAdminCentersComponent },
      { path: 'centers/create', component: SystemAdminCreateCenterComponent },
      { path: 'centers/:id', component: SystemAdminCenterDetailsComponent },
      { path: 'managers', component: SystemAdminManagersComponent },
      { path: 'settings', component: SystemAdminSettingsComponent },
    ],
  },

  // CenterManager Routes
  {
    path: 'center-manager',
    component: CenterLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'CenterManager' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CenterManagerDashboardComponent },
      { path: 'employees', component: CenterManagerEmployeesComponent },
      { path: 'attendance', component: CenterManagerAttendanceComponent },
      { path: 'shifts', component: CenterManagerShiftsComponent },
      { path: 'requests', component: CenterManagerRequestsComponent },
      { path: 'reports', component: CenterManagerReportsComponent },
      { path: 'notifications', component: CenterManagerNotificationsComponent },
      { path: 'settings', component: CenterManagerSettingsComponent },
    ],
  },

  // Employee Routes
  {
    path: 'employee',
    component: EmployeeLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Employee' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EmployeeDashboardComponent },
      { path: 'profile', component: EmployeePlaceholderPageComponent },
      { path: 'attendance', component: EmployeePlaceholderPageComponent },
      { path: 'leaves', component: EmployeePlaceholderPageComponent },
      { path: 'requests', component: EmployeePlaceholderPageComponent },
      { path: 'notifications', component: EmployeePlaceholderPageComponent },
      { path: 'settings', component: EmployeePlaceholderPageComponent },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
