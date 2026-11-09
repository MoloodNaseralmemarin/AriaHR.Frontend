import { Injectable, signal, computed } from '@angular/core';

/**
 * Service managing PWA startup lifecycle, standalone detection, and splash screen display.
 */
@Injectable({ providedIn: 'root' })
export class PwaStartupService {
  /** Whether the splash screen overlay is currently visible */
  readonly isSplashVisible = signal<boolean>(true);

  /** Whether the splash screen is fading out */
  readonly isSplashFading = signal<boolean>(false);

  /** Whether the app was opened in standalone PWA mode */
  readonly isStandalone = signal<boolean>(this.detectStandaloneMode());

  /** Whether the app is currently in the background (used for privacy overlay) */
  readonly isAppHidden = signal<boolean>(false);

  /** Minimum splash duration in ms (1600ms = 1.6s) */
  private readonly minSplashDuration = 1600;
  private readonly fadeOutDuration = 350;
  private readonly startupTime = Date.now();

  constructor() {
    this.setupVisibilityListeners();
  }

  /**
   * Detects if the current runtime is standalone PWA mode (iOS navigator.standalone or standard display-mode: standalone).
   */
  detectStandaloneMode(): boolean {
    if (typeof window === 'undefined') return false;

    const nav = window.navigator as unknown as { standalone?: boolean };
    const isIosStandalone = Boolean(nav && nav.standalone === true);

    const isMediaStandalone =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;

    return isIosStandalone || isMediaStandalone;
  }

  /**
   * Completes initialization and starts smooth fade-out of the splash screen.
   * Ensures the splash screen remains visible for at least minSplashDuration (1.6s).
   */
  dismissSplash(): Promise<void> {
    return new Promise<void>((resolve) => {
      const elapsed = Date.now() - this.startupTime;
      const remaining = Math.max(0, this.minSplashDuration - elapsed);

      setTimeout(() => {
        this.isSplashFading.set(true);
        setTimeout(() => {
          this.isSplashVisible.set(false);
          this.isSplashFading.set(false);
          resolve();
        }, this.fadeOutDuration);
      }, remaining);
    });
  }

  /**
   * Sets up document visibilitychange listeners for privacy overlay handling on iOS.
   * When user enters background/app switcher, privacy overlay appears.
   * When user returns to active app, privacy overlay is dismissed without logging them out.
   */
  private setupVisibilityListeners(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.isAppHidden.set(true);
      } else if (document.visibilityState === 'visible') {
        this.isAppHidden.set(false);
      }
    });

    window.addEventListener('pagehide', () => {
      this.isAppHidden.set(true);
    });

    window.addEventListener('pageshow', () => {
      this.isAppHidden.set(false);
    });
  }
}
