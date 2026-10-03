import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { NonNullableFormBuilder, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CreateWorkLocationComponent } from './create-work-location.component';
import { WorkLocationService } from '../../services/work-location.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('CreateWorkLocationComponent (Isolated Unit Tests)', () => {
  const mockWorkLocationService = {
    createWorkLocation: vi.fn().mockReturnValue(
      of({
        id: 'wl-123',
        organizationId: 'org-1',
        latitude: 35.7,
        longitude: 51.3,
        radiusInMeters: 200,
        isActive: true,
      })
    ),
    generateQrCode: vi.fn().mockReturnValue(
      of({
        code: 'sample-token-code',
        expiresAtUtc: '2026-10-03T12:00:00Z',
      })
    ),
    reverseGeocode: vi.fn().mockReturnValue(of('آدرس تست')),
  };

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({
      id: 'usr-1',
      organizationId: 'org-1',
    }),
    getCurrentUser: vi.fn().mockReturnValue(of(null)),
  };

  function createComponent(): CreateWorkLocationComponent {
    const fb = new FormBuilder().nonNullable;
    const injector = Injector.create({
      providers: [
        { provide: NonNullableFormBuilder, useValue: fb },
        { provide: WorkLocationService, useValue: mockWorkLocationService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    let comp!: CreateWorkLocationComponent;
    runInInjectionContext(injector, () => {
      comp = new CreateWorkLocationComponent();
    });
    return comp;
  }

  it('should store createdWorkLocationId when createWorkLocation succeeds', () => {
    const comp = createComponent();
    comp.selectLocation(35.7, 51.3);
    comp.onSubmit();

    expect(comp.createdWorkLocationId()).toBe('wl-123');
    expect(comp.showSuccessToast()).toBe(true);
  });

  it('should call generateQrCode and set qrData when onGenerateQrCode is triggered', () => {
    const comp = createComponent();
    comp.createdWorkLocationId.set('wl-123');

    comp.onGenerateQrCode();

    expect(mockWorkLocationService.generateQrCode).toHaveBeenCalledWith('wl-123');
    expect(comp.showQrModal()).toBe(true);
    expect(comp.qrData()).toEqual({
      code: 'sample-token-code',
      expiresAtUtc: '2026-10-03T12:00:00Z',
    });
  });

  it('should handle generateQrCode 404 error with appropriate Persian error message', () => {
    mockWorkLocationService.generateQrCode.mockReturnValueOnce(
      throwError(() => ({ status: 404, error: { message: 'محل کار یافت نشد.' } }))
    );

    const comp = createComponent();
    comp.createdWorkLocationId.set('wl-404');

    comp.onGenerateQrCode();

    expect(comp.showQrModal()).toBe(false);
    expect(comp.errorMessage()).toBe('محل کار یافت نشد.');
  });
});
