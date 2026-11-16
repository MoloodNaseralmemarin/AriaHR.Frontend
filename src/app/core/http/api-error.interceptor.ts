import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { isBackendRequest } from '../auth/auth.interceptor';
import { NotificationService } from '../services/notification.service';
import { parseApiError } from './api-error.util';

/**
 * Centralized API error presentation.
 *
 * Every failed backend request is converted from ASP.NET Core ProblemDetails
 * (or a legacy/network error) into one Persian message and shown through the
 * shared notification service. The original error is always rethrown so
 * components can still react to specific status codes and map validation
 * errors onto their form controls.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isBackendRequest(req.url)) {
        const info = parseApiError(error);
        if (shouldNotify(info.status, router.url)) {
          notifications.showError(info.message);
        }
      }
      return throwError(() => error);
    })
  );
};

/**
 * 401 already redirects to the login page through the auth interceptor, so the
 * login screen itself does not need an extra "session expired" toast.
 */
function shouldNotify(status: number, currentUrl: string): boolean {
  if (status === 401 && currentUrl.startsWith('/login')) {
    return false;
  }
  return true;
}
