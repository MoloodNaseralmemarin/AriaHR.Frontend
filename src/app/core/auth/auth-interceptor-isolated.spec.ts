import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { authInterceptor, isBackendRequest } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  const createContext = () => {
    const authService = {
      token: signal<string | null>('jwt-token-123'),
      logout: vi.fn(),
    };
    const router = { url: '/center-manager/work-locations/create', navigate: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    return { authService, router, injector };
  };

  it('attaches the bearer token to same-origin backend requests', () => {
    const { injector } = createContext();
    const request = new HttpRequest('POST', '/api/organizations/work-locations', {});

    let forwarded: HttpRequest<unknown> | null = null;
    runInInjectionContext(injector, () => {
      authInterceptor(request, (req) => {
        forwarded = req as HttpRequest<unknown>;
        return of(new HttpResponse({ status: 201 }));
      }).subscribe();
    });

    expect(forwarded!.headers.get('Authorization')).toBe('Bearer jwt-token-123');
  });

  it('never sends the session token to third-party origins such as Neshan', () => {
    const { injector } = createContext();
    const request = new HttpRequest(
      'GET',
      'https://api.neshan.org/v5/reverse?lat=34.8&lng=48.5'
    );

    let forwarded: HttpRequest<unknown> | null = null;
    runInInjectionContext(injector, () => {
      authInterceptor(request, (req) => {
        forwarded = req as HttpRequest<unknown>;
        return of(new HttpResponse({ status: 200 }));
      }).subscribe();
    });

    expect(forwarded!.headers.has('Authorization')).toBe(false);
  });

  it('clears the session on 401 responses', () => {
    const { injector, authService, router } = createContext();
    const request = new HttpRequest('GET', '/api/organizations/work-locations');

    runInInjectionContext(injector, () => {
      authInterceptor(request, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({
        error: () => {},
      });
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('classifies backend versus third-party URLs', () => {
    expect(isBackendRequest('/api/organizations/work-locations')).toBe(true);
    expect(isBackendRequest('https://api.neshan.org/v5/reverse?lat=1&lng=1')).toBe(false);
    expect(isBackendRequest('https://static.neshan.org/sdk/leaflet/index.js')).toBe(false);
  });
});
