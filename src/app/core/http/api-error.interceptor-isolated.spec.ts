import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

import { apiErrorInterceptor } from './api-error.interceptor';
import { NotificationService } from '../services/notification.service';

describe('apiErrorInterceptor', () => {
  const createContext = (url = '/center-manager/dashboard') => {
    const notifications = { showError: vi.fn() };
    const router = { url };

    const injector = Injector.create({
      providers: [
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
      ],
    });

    return { notifications, injector };
  };

  const run = (
    injector: Injector,
    url: string,
    error: HttpErrorResponse
  ): { received: unknown } => {
    const request = new HttpRequest('POST', url, {});
    const result: { received: unknown } = { received: null };

    runInInjectionContext(injector, () => {
      apiErrorInterceptor(request, () => throwError(() => error)).subscribe({
        error: (err) => {
          result.received = err;
        },
      });
    });

    return result;
  };

  it('shows the ProblemDetails detail and rethrows the original error', () => {
    const { injector, notifications } = createContext();
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'خطای کسب و کار',
        status: 400,
        detail: 'شرح دقیق خطای رخ داده در سیستم',
      },
    });

    const { received } = run(injector, '/api/leave-requests', error);

    expect(notifications.showError).toHaveBeenCalledOnce();
    expect(notifications.showError).toHaveBeenCalledWith('شرح دقیق خطای رخ داده در سیستم');
    expect(received).toBe(error);
  });

  it('reports validation errors when no detail is available', () => {
    const { injector, notifications } = createContext();
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'One or more validation errors occurred.',
        errors: { EndTime: ['ساعت پایان باید بعد از ساعت شروع باشد.'] },
      },
    });

    run(injector, '/api/leave-requests', error);

    expect(notifications.showError).toHaveBeenCalledWith('ساعت پایان باید بعد از ساعت شروع باشد.');
  });

  it('ignores third-party requests such as Neshan', () => {
    const { injector, notifications } = createContext();
    const error = new HttpErrorResponse({ status: 500, error: { detail: 'خطای سرویس نقشه' } });

    run(injector, 'https://api.neshan.org/v5/reverse?lat=1&lng=1', error);

    expect(notifications.showError).not.toHaveBeenCalled();
  });

  it('does not duplicate the session-expired toast on the login page', () => {
    const { injector, notifications } = createContext('/login');
    const error = new HttpErrorResponse({ status: 401 });

    run(injector, '/api/auth/me', error);

    expect(notifications.showError).not.toHaveBeenCalled();
  });

  it('reports session expiry away from the login page', () => {
    const { injector, notifications } = createContext('/employee/dashboard');
    const error = new HttpErrorResponse({ status: 401 });

    run(injector, '/api/leave-requests', error);

    expect(notifications.showError).toHaveBeenCalledWith(
      'نشست شما منقضی شده است. لطفاً دوباره وارد حساب خود شوید.'
    );
  });
});
