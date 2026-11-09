import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';

import { App } from './app';
import { AuthService } from './core/auth/auth.service';
import { PwaStartupService } from './core/services/pwa-startup.service';

describe('App Startup Integration (Isolated Unit Tests)', () => {
  let app: App;
  let authServiceMock: { invalidateSessionOnStartup: ReturnType<typeof vi.fn> };
  let pwaStartupServiceMock: {
    isStandalone: ReturnType<typeof vi.fn>;
    dismissSplash: ReturnType<typeof vi.fn>;
    isSplashVisible: ReturnType<typeof vi.fn>;
    isAppHidden: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    authServiceMock = {
      invalidateSessionOnStartup: vi.fn(),
    };

    pwaStartupServiceMock = {
      isStandalone: vi.fn().mockReturnValue(true),
      dismissSplash: vi.fn().mockResolvedValue(undefined),
      isSplashVisible: vi.fn().mockReturnValue(true),
      isAppHidden: vi.fn().mockReturnValue(false),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    const injector = createEnvironmentInjector([
      { provide: AuthService, useValue: authServiceMock },
      { provide: PwaStartupService, useValue: pwaStartupServiceMock },
      { provide: Router, useValue: routerMock },
      { provide: App, useClass: App },
    ], {} as EnvironmentInjector);

    app = injector.get(App);
  });

  it('should invalidate session and navigate to /login with replaceUrl in standalone mode on cold start', () => {
    pwaStartupServiceMock.isStandalone.mockReturnValue(true);

    app.ngOnInit();

    expect(authServiceMock.invalidateSessionOnStartup).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    expect(pwaStartupServiceMock.dismissSplash).toHaveBeenCalledTimes(1);
  });

  it('should NOT invalidate session or redirect to /login when running in standard browser mode', () => {
    pwaStartupServiceMock.isStandalone.mockReturnValue(false);

    app.ngOnInit();

    expect(authServiceMock.invalidateSessionOnStartup).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(pwaStartupServiceMock.dismissSplash).toHaveBeenCalledTimes(1);
  });
});
