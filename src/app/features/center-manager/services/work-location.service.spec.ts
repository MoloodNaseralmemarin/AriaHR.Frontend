import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { WorkLocationService } from './work-location.service';
import { environment } from '../../../../environments/environment';

/**
 * TestBed is not usable in this project's vitest setup (every TestBed-based spec
 * fails while compiling the dynamic module), so the service is built in an injection
 * context with a stubbed HttpClient, like the other passing specs in the repo.
 */
describe('WorkLocationService', () => {
  let service: WorkLocationService;
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  const createService = (): void => {
    http = { get: vi.fn(), post: vi.fn() };

    const injector = Injector.create({
      providers: [{ provide: HttpClient, useValue: http }],
    });

    runInInjectionContext(injector, () => {
      service = new WorkLocationService();
    });
  };

  beforeEach(() => {
    environment.neshanServiceApiKey = '';
    createService();
  });

  afterEach(() => {
    environment.neshanServiceApiKey = '';
  });

  it('should call the Neshan v5 reverse endpoint with the services key', () => {
    environment.neshanServiceApiKey = 'service-key-123';
    http.get.mockReturnValue(of({ status: 'OK', formatted_address: 'تهران، خیابان ولیعصر' }));

    let address: string | null = null;
    service.reverseGeocode(35.7, 51.3).subscribe((value) => (address = value));

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe('https://api.neshan.org/v5/reverse?lat=35.7&lng=51.3');
    expect(options.headers.get('Api-Key')).toBe('service-key-123');
    expect(address).toBe('تهران، خیابان ولیعصر');
  });

  it('should compose a Persian address from the v5 parts when formatted_address is missing', () => {
    environment.neshanServiceApiKey = 'service-key-123';
    http.get.mockReturnValue(
      of({ status: 'OK', neighbourhood: 'ولیعصر', city: 'تهران', state: 'تهران' })
    );

    let address: string | null = null;
    service.reverseGeocode(35.7, 51.3).subscribe((value) => (address = value));

    expect(address).toBe('ولیعصر، تهران');
  });

  it('should report whether reverse geocoding is configured', () => {
    expect(service.hasReverseGeocodingKey).toBe(false);

    environment.neshanServiceApiKey = 'service-key-123';
    expect(service.hasReverseGeocodingKey).toBe(true);
  });

  it('should not call the API when no services key is configured', () => {
    let address: string | null = 'unset';
    service.reverseGeocode(35.7, 51.3).subscribe((value) => (address = value));

    expect(http.get).not.toHaveBeenCalled();
    expect(address).toBeNull();
  });

  it('should return null when Neshan rejects the key (a Web Map key is not valid for this service)', () => {
    environment.neshanServiceApiKey = 'web-key-123';
    http.get.mockReturnValue(
      throwError(() => ({
        status: 483,
        error: { status: 'ERROR', code: 483, message: 'API Key type not suitable for this service.' },
      }))
    );

    let address: string | null = 'unset';
    service.reverseGeocode(35.7, 51.3).subscribe((value) => (address = value));

    expect(address).toBeNull();
  });

  it('should return null for an empty response body', () => {
    environment.neshanServiceApiKey = 'service-key-123';
    http.get.mockReturnValue(of({ status: 'OK' }));

    let address: string | null = 'unset';
    service.reverseGeocode(35.7, 51.3).subscribe((value) => (address = value));

    expect(address).toBeNull();
  });

  it('should create a work location with the expected payload and endpoint', () => {
    http.post.mockReturnValue(of({ id: 'wl-1' }));

    service
      .createWorkLocation({
        organizationId: 'org-1',
        latitude: 35.7,
        longitude: 51.3,
        radiusInMeters: 200,
        isActive: true,
      })
      .subscribe();

    const [url, body] = http.post.mock.calls[0];
    expect(url).toBe(`${environment.apiUrl}/api/organizations/work-locations`);
    expect(body.radiusInMeters).toBe(200);
  });

  it('should call generateQrCode with POST and no request body', () => {
    http.post.mockReturnValue(
      of({ code: 'test-code-123', expiresAtUtc: '2026-10-03T10:00:00Z' })
    );

    let response: unknown = null;
    service.generateQrCode('wl-999').subscribe((res) => (response = res));

    const [url, body] = http.post.mock.calls[0];
    expect(url).toBe(`${environment.apiUrl}/api/organizations/work-locations/wl-999/qr`);
    expect(body).toBeNull();
    expect(response).toEqual({ code: 'test-code-123', expiresAtUtc: '2026-10-03T10:00:00Z' });
  });
});
