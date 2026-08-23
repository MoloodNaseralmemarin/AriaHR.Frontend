/**
 * EXAMPLE / REFERENCE FILE — NOT a drop-in replacement.
 *
 * No existing project files were available to inspect in this session,
 * so the real `app.routes.ts` (or feature-level routing file) could not
 * be located or edited directly. This file shows the minimal change
 * needed to register the Splash Screen as the app's entry route.
 *
 * --------------------------------------------------------------------
 * HOW TO APPLY THIS TO YOUR PROJECT
 * --------------------------------------------------------------------
 * 1. Open your actual routing file (commonly `src/app/app.routes.ts`).
 * 2. Add the import for SplashComponent.
 * 3. Add the `splash` route entry, and point the empty-path (`''`)
 *    redirect to `splash` instead of `login` (or whatever it
 *    currently points to) so the app opens on the Splash Screen first.
 * 4. Leave every other existing route untouched.
 */

import { Routes } from '@angular/router';
import { SplashComponent } from './features/auth/pages/splash/splash.component';
// import { LoginComponent } from './features/auth/pages/login/login.component'; // adjust to your real path

export const routes: Routes = [
  // App entry point: show splash first.
  { path: '', redirectTo: 'splash', pathMatch: 'full' },

  { path: 'splash', component: SplashComponent },

  // Keep your existing login route as-is — shown here only for context.
  // { path: 'login', component: LoginComponent },

  // ... rest of your existing routes remain unchanged ...
];
