import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';

import { SplashScreenComponent } from './splash-screen.component';
import { PwaStartupService } from '../../../core/services/pwa-startup.service';

describe('SplashScreenComponent (Isolated Unit Tests)', () => {
  let component: SplashScreenComponent;
  let pwaStartupServiceMock: {
    isSplashVisible: ReturnType<typeof vi.fn>;
    isSplashFading: ReturnType<typeof vi.fn>;
    isStandalone: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    pwaStartupServiceMock = {
      isSplashVisible: vi.fn().mockReturnValue(true),
      isSplashFading: vi.fn().mockReturnValue(false),
      isStandalone: vi.fn().mockReturnValue(true),
    };

    const injector = createEnvironmentInjector([
      { provide: PwaStartupService, useValue: pwaStartupServiceMock },
      { provide: SplashScreenComponent, useClass: SplashScreenComponent },
    ], {} as EnvironmentInjector);

    component = injector.get(SplashScreenComponent);
  });

  it('should instantiate successfully with injected PwaStartupService', () => {
    expect(component).toBeTruthy();
  });
});
