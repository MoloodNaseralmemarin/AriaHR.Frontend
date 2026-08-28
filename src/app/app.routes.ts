import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
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

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'verify-otp', component: VerifyOtpPageComponent },
  {
    path: 'system-admin',
    component: SystemAdminLayoutComponent,
    canActivate: [authGuard],
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
];
