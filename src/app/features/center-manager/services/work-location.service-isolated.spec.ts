import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { WorkLocationService } from './work-location.service';
import { environment } from '../../../../environments/environment';

describe('WorkLocationService (Isolated Unit Tests)', () => {
  const mockHttpClient = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createService(): WorkLocationService {
    const injector = Injector.create({
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    });

    let service!: WorkLocationService;
    runInInjectionContext(injector, () => {
      service = new WorkLocationService();
    });
    return service;
  }

  it('should POST to /api/organizations/work-locations/{id}/qrcode/generate', () => {
    const mockResponse = {
      workLocationId: 'wl-123',
      qrCodeMode: 'Dynamic',
      token: 'signed-token-value',
      expiresAtUtc: '2026-10-03T09:56:27.7920385Z',
      refreshAfterUtc: '2026-10-03T09:55:27.7920385Z',
      generatedAtUtc: '2026-10-03T09:55:27.7920385Z',
      qrCodeEnabled: true,
      rotationIntervalMinutes: 5,
    };
    mockHttpClient.post.mockReturnValue(of(mockResponse));

    const service = createService();
    service.generateQrCode('wl-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/organizations/work-locations/wl-123/qrcode/generate`,
      null
    );
  });

  it('should POST to /qrcode/enable and /qrcode/disable', () => {
    mockHttpClient.post.mockReturnValue(of({}));
    const service = createService();

    service.enableQrCode('wl-1').subscribe();
    service.disableQrCode('wl-1').subscribe();

    expect(mockHttpClient.post).toHaveBeenNthCalledWith(
      1,
      `${environment.apiUrl}/api/organizations/work-locations/wl-1/qrcode/enable`,
      null
    );
    expect(mockHttpClient.post).toHaveBeenNthCalledWith(
      2,
      `${environment.apiUrl}/api/organizations/work-locations/wl-1/qrcode/disable`,
      null
    );
  });

  it('should GET/PUT the QR settings of a work location', () => {
    mockHttpClient.get.mockReturnValue(of({}));
    mockHttpClient.put.mockReturnValue(of({}));
    const service = createService();

    service.getQrCodeSettings('wl-1').subscribe();
    service.updateQrCodeSettings('wl-1', { qrCodeMode: 'Dynamic', qrRotationIntervalMinutes: 5 }).subscribe();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/organizations/work-locations/wl-1/qrcode/settings`
    );
    expect(mockHttpClient.put).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/organizations/work-locations/wl-1/qrcode/settings`,
      { qrCodeMode: 'Dynamic', qrRotationIntervalMinutes: 5 }
    );
  });

  it('should pass organizationId as a query parameter when listing work locations', () => {
    mockHttpClient.get.mockReturnValue(of([]));
    const service = createService();

    service.getWorkLocations('org-1').subscribe();

    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe(`${environment.apiUrl}/api/organizations/work-locations`);
    expect(options.params.get('organizationId')).toBe('org-1');
  });
});
