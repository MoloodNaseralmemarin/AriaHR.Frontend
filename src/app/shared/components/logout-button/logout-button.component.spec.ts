import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { LogoutButtonComponent } from './logout-button.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('LogoutButtonComponent', () => {
  let component: LogoutButtonComponent;
  let mockAuthService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = { logout: vi.fn() };

    const injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      component = new LogoutButtonComponent();
    });
  });

  it('should default to the sidebar variant used at the bottom of the desktop sidebar', () => {
    expect(component.variant).toBe('sidebar');
  });

  it('should accept the compact nav variant', () => {
    component.variant = 'nav';
    expect(component.variant).toBe('nav');
  });

  it('should delegate logout to AuthService so session cleanup stays in one place', () => {
    component.onLogout();

    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });
});
