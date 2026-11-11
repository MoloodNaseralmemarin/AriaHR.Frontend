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

  it('should accept menu-item variant', () => {
    component.variant = 'menu-item';
    expect(component.variant).toBe('menu-item');
  });

  it('should open confirmation modal on trigger and not logout immediately', () => {
    expect(component.showModal()).toBe(false);
    component.onLogout();
    expect(component.showModal()).toBe(true);
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should delegate logout to AuthService upon confirmed logout', () => {
    component.openModal();
    expect(component.showModal()).toBe(true);

    component.onConfirmedLogout();

    expect(component.showModal()).toBe(false);
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });
});
