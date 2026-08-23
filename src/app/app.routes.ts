import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/pages/login/login-page.component';
import { VerifyOtpPageComponent } from './features/auth/pages/verify-otp/verify-otp-page.component';
import { SplashComponent } from './features/auth/pages/splash/splash.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    component: SplashComponent,
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
