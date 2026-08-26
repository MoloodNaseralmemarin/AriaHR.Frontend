import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login/login-page.component';
import { SplashComponent } from './features/auth/pages/splash/splash.component';
import { VerifyOtpPageComponent } from './features/auth/pages/verify-otp/verify-otp-page.component';
import { SystemAdminLayoutComponent } from './features/system-admin/layout/system-admin-layout.component';
import { SystemAdminDashboardComponent } from './features/system-admin/pages/dashboard/system-admin-dashboard.component';
import { SystemAdminCentersComponent } from './features/system-admin/pages/centers/system-admin-centers.component';
import { SystemAdminCenterDetailsComponent } from './features/system-admin/pages/center-details/system-admin-center-details.component';
import { SystemAdminCreateCenterComponent } from './features/system-admin/pages/create-center/system-admin-create-center.component';
import { SystemAdminManagersComponent } from './features/system-admin/pages/managers/system-admin-managers.component';
import { SystemAdminSettingsComponent } from './features/system-admin/pages/settings/system-admin-settings.component';

import { CenterLayoutComponent } from './features/center-manager/layout/center-layout.component';
import { DashboardComponent as CenterDashboardComponent } from './features/center-manager/pages/dashboard/dashboard.component';
import { EmployeesComponent as CenterEmployeesComponent } from './features/center-manager/pages/employees/employees.component';
import { AttendanceComponent as CenterAttendanceComponent } from './features/center-manager/pages/attendance/attendance.component';
import { ShiftsComponent as CenterShiftsComponent } from './features/center-manager/pages/shifts/shifts.component';
import { RequestsComponent as CenterRequestsComponent } from './features/center-manager/pages/requests/requests.component';
import { ReportsComponent as CenterReportsComponent } from './features/center-manager/pages/reports/reports.component';
import { NotificationsComponent as CenterNotificationsComponent } from './features/center-manager/pages/notifications/notifications.component';
import { SettingsComponent as CenterSettingsComponent } from './features/center-manager/pages/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'verify-otp', component: VerifyOtpPageComponent },
  {
    path: 'system-admin', component: SystemAdminLayoutComponent,
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
  {
    path: 'center-manager',
    component: CenterLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CenterDashboardComponent },
      { path: 'employees', component: CenterEmployeesComponent },
      { path: 'attendance', component: CenterAttendanceComponent },
      { path: 'shifts', component: CenterShiftsComponent },
      { path: 'requests', component: CenterRequestsComponent },
      { path: 'reports', component: CenterReportsComponent },
      { path: 'notifications', component: CenterNotificationsComponent },
      { path: 'settings', component: CenterSettingsComponent },
    ],
  },
];
