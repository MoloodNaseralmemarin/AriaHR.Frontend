import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * True when a request targets the AriaHR backend, either through the configured
 * API base URL or a same-origin relative path.
 *
 * The session token must never be attached to third-party origins (for example
 * the Neshan reverse-geocoding API), otherwise the app's JWT leaks outside the
 * backend trust boundary.
 */
export function isBackendRequest(url: string): boolean {
  if (/^(https?:)?\/\//i.test(url)) {
    const base = environment.apiUrl.trim().replace(/\/+$/, '');
    if (!base) {
      return false;
    }
    return url === base || url.startsWith(`${base}/`);
  }

  return url.startsWith('/');
}

/**
 * Functional HTTP interceptor that attaches stored Bearer token to backend
 * requests and handles 401 Unauthorized responses by clearing auth state and
 * navigating to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

  let authReq = req;
  if (token && isBackendRequest(req.url)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
        if (router.url !== '/login') {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
