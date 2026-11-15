import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { LogoutModalService } from './logout-modal.service';
import { AuthService } from '../auth/auth.service';

describe('LogoutModalService', () => {
  let service: LogoutModalService;
  let mockAuthService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = { logout: vi.fn() };

    const injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      service = new LogoutModalService();
    });
  });

  it('should start closed', () => {
    expect(service.isOpen()).toBe(false);
  });

  it('should open the dialog without ending the session', () => {
    service.open();

    expect(service.isOpen()).toBe(true);
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should close the dialog without ending the session', () => {
    service.open();
    service.close();

    expect(service.isOpen()).toBe(false);
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should close the dialog and log out when confirmed', () => {
    service.open();
    service.confirm();

    expect(service.isOpen()).toBe(false);
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });
});
