import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Functional guard that enforces role-based access control for routes.
 * Checks if the authenticated user possesses the role specified in route data (`role` or `roles`).
 * If unauthorized, redirects the user to their role's default dashboard route.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles: string[] = route.data?.['roles']
    ? (route.data['roles'] as string[])
    : route.data?.['role']
    ? [route.data['role'] as string]
    : [];

  const userRole = authService.getUserRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // If unauthorized for the target route, redirect to user's default dashboard
  const defaultRoute = authService.getDefaultDashboardRoute();
  return router.createUrlTree([defaultRoute]);
};
