import { Routes } from '@angular/router';

import { otpFlowGuard } from './core/guards/otp-flow.guard';

/**
 * No routing existed in the project as provided, so this file is scaffolded
 * fresh with only what the login → verify-otp → dashboard flow needs. Merge
 * these routes into the app's real root routes file if one already exists
 * elsewhere in the project.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'verify-otp',
    canActivate: [otpFlowGuard],
    loadComponent: () =>
      import('./features/auth/verify-otp/verify-otp-page.component').then(
        (m) => m.VerifyOtpPageComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  { path: '**', redirectTo: 'login' },
];
