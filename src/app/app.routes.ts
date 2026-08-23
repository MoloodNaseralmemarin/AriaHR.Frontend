import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login/login-page.component';
import { VerifyOtpPageComponent } from './features/auth/pages/verify-otp/verify-otp-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'verify-otp',
    component: VerifyOtpPageComponent,
  },
];
