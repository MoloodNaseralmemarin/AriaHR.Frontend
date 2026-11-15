import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { LogoutButtonComponent } from './logout-button.component';
import { LogoutModalService } from '../../../core/services/logout-modal.service';

describe('LogoutButtonComponent', () => {
  let component: LogoutButtonComponent;
  let mockLogoutModal: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLogoutModal = { open: vi.fn() };

    const injector = Injector.create({
      providers: [{ provide: LogoutModalService, useValue: mockLogoutModal }],
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

  it('should open the shared confirmation modal on trigger without logging out', () => {
    component.onLogout();
    expect(mockLogoutModal.open).toHaveBeenCalledTimes(1);
  });

  it('should open the shared confirmation modal from the button handler', () => {
    component.openModal();
    expect(mockLogoutModal.open).toHaveBeenCalledTimes(1);
  });
});
