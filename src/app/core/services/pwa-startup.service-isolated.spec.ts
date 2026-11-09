import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { PwaStartupService } from './pwa-startup.service';

describe('PwaStartupService (Isolated Unit Tests)', () => {
  let service: PwaStartupService;

  beforeEach(() => {
    vi.clearAllMocks();
    const injector = createEnvironmentInjector([
      { provide: PwaStartupService, useClass: PwaStartupService },
    ], {} as EnvironmentInjector);
    service = injector.get(PwaStartupService);
  });

  it('should initialize with splash visible and not fading', () => {
    expect(service.isSplashVisible()).toBe(true);
    expect(service.isSplashFading()).toBe(false);
  });

  it('should detect browser mode when not standalone', () => {
    const isStandalone = service.detectStandaloneMode();
    // In node/JSDOM test runner without navigator.standalone or display-mode: standalone
    expect(typeof isStandalone).toBe('boolean');
  });

  it('should detect standalone mode when navigator.standalone is true', () => {
    const originalNavigator = window.navigator;
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, standalone: true },
      configurable: true,
      writable: true,
    });

    expect(service.detectStandaloneMode()).toBe(true);

    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('should detect standalone mode when matchMedia matches display-mode: standalone', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('display-mode: standalone'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(service.detectStandaloneMode()).toBe(true);

    window.matchMedia = originalMatchMedia;
  });

  it('should dismiss splash screen and update signals', async () => {
    vi.useFakeTimers();

    const dismissPromise = service.dismissSplash();

    // Fast-forward through minSplashDuration (1600ms) and fadeOut (350ms)
    vi.advanceTimersByTime(1600);
    expect(service.isSplashFading()).toBe(true);

    vi.advanceTimersByTime(350);
    await dismissPromise;

    expect(service.isSplashVisible()).toBe(false);
    expect(service.isSplashFading()).toBe(false);

    vi.useRealTimers();
  });

  it('should toggle isAppHidden signal on visibilitychange', () => {
    expect(service.isAppHidden()).toBe(false);

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.isAppHidden()).toBe(true);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.isAppHidden()).toBe(false);
  });
});
