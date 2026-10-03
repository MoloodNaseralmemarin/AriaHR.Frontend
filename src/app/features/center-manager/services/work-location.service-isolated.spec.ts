import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { WorkLocationService } from './work-location.service';
import { environment } from '../../../../environments/environment';

describe('WorkLocationService (Isolated Unit Tests)', () => {
  const mockHttpClient = {
    post: vi.fn(),
    get: vi.fn(),
  };

  function createService(): WorkLocationService {
    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });

    let service!: WorkLocationService;
    runInInjectionContext(injector, () => {
      service = new WorkLocationService();
    });
    return service;
  }

  it('should call generateQrCode with POST to /api/organizations/work-locations/{id}/qr', () => {
    const mockResponse = {
      code: '40fdd938e5e87adeef2109bb200fe6d4cadf5773ffd1fb5ef078baff4278f0bb',
      expiresAtUtc: '2026-10-03T09:56:27.7920385Z',
    };
    mockHttpClient.post.mockReturnValue(of(mockResponse));

    const service = createService();
    service.generateQrCode('wl-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/organizations/work-locations/wl-123/qr`,
      null
    );
  });
});
