import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from './auth.service';
import { AuthApiService } from './auth-api.service';

describe('AuthService Startup Invalidation (Isolated Unit Tests)', () => {
  let authService: AuthService;
  let authApiMock: { logout: ReturnType<typeof vi.fn>; sendOtp: ReturnType<typeof vi.fn>; verifyOtp: ReturnType<typeof vi.fn>; getCurrentUser: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();

    authApiMock = {
      logout: vi.fn().mockReturnValue(of({ success: true })),
      sendOtp: vi.fn().mockReturnValue(of({ success: true })),
      verifyOtp: vi.fn().mockReturnValue(of({ success: true })),
      getCurrentUser: vi.fn().mockReturnValue(of(null)),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    const injector = createEnvironmentInjector([
      { provide: AuthApiService, useValue: authApiMock },
      { provide: Router, useValue: routerMock },
      { provide: AuthService, useClass: AuthService },
    ], {} as EnvironmentInjector);

    authService = injector.get(AuthService);
  });

  it('should invalidate active session synchronously and trigger best-effort logout', () => {
    // Seed existing authentication session
    authService.saveAuthentication('mock-token-xyz', 'mock-refresh-token', {
      id: '123',
      phoneNumber: '09123456789',
      roles: ['Employee'],
    });

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.token()).toBe('mock-token-xyz');
    expect(localStorage.getItem('aria_hr_access_token')).toBe('mock-token-xyz');
    expect(localStorage.getItem('aria_hr_refresh_token')).toBe('mock-refresh-token');

    // Perform startup invalidation
    authService.invalidateSessionOnStartup();

    // Verify synchronous clearing of state, signals, and storage
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.token()).toBeNull();
    expect(authService.currentUser()).toBeNull();
    expect(authService.userDetails()).toBeNull();

    expect(localStorage.getItem('aria_hr_access_token')).toBeNull();
    expect(localStorage.getItem('aria_hr_refresh_token')).toBeNull();
    expect(localStorage.getItem('aria_hr_user')).toBeNull();
    expect(sessionStorage.getItem('aria_hr_access_token')).toBeNull();

    // Verify non-blocking logout was called
    expect(authApiMock.logout).toHaveBeenCalledTimes(1);
  });

  it('should clear stored session even if no active token exists without calling backend logout', () => {
    expect(authService.token()).toBeNull();

    authService.invalidateSessionOnStartup();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authApiMock.logout).not.toHaveBeenCalled();
  });
});
