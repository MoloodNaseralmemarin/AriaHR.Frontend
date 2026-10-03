import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';

import { QrCodeModalComponent } from './qr-code-modal.component';
import { PersianDateService } from '../../../core/services/persian-date.service';

describe('QrCodeModalComponent (Isolated Unit Tests)', () => {
  const mockPersianDateService = {
    toJalaliString: vi.fn().mockReturnValue('۱۵-۰۲-۱۴۰۵'),
  };

  function createComponent(): QrCodeModalComponent {
    const injector = Injector.create({
      providers: [
        { provide: PersianDateService, useValue: mockPersianDateService },
      ],
    });

    let comp!: QrCodeModalComponent;
    runInInjectionContext(injector, () => {
      comp = new QrCodeModalComponent();
    });
    return comp;
  }

  it('should generate QR code Data URL and format expiration date on ngOnChanges', async () => {
    const comp = createComponent();
    comp.code = '40fdd938e5e87adeef2109bb200fe6d4cadf5773ffd1fb5ef078baff4278f0bb';
    comp.expiresAtUtc = '2026-10-03T09:56:27.7920385Z';

    comp.ngOnChanges({
      code: {
        currentValue: comp.code,
        previousValue: '',
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    // Wait for QRCode.toDataURL promise
    await new Promise((r) => setTimeout(r, 50));

    expect(comp.isGenerating()).toBe(false);
    expect(comp.qrDataUrl()).toContain('data:image/png;base64,');
    expect(comp.formattedExpiration()).toContain('۱۵-۰۲-۱۴۰۵');
  });

  it('should emit closeModal event when onClose is called', () => {
    const comp = createComponent();
    const spy = vi.spyOn(comp.closeModal, 'emit');

    comp.onClose();

    expect(spy).toHaveBeenCalled();
  });
});
