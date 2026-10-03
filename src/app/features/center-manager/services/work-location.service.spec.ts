import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { WorkLocationService } from './work-location.service';
import { environment } from '../../../../environments/environment';

describe('WorkLocationService', () => {
  let service: WorkLocationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [WorkLocationService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WorkLocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should use neshanServiceApiKey when provided in environment', () => {
    environment.neshanServiceApiKey = 'service-key-123';

    service.reverseGeocode(35.7, 51.3).subscribe((addr) => {
      expect(addr).toBe('Tehran, Iran');
    });

    const req = httpMock.expectOne('https://api.neshan.org/v2/reverse?lat=35.7&lng=51.3');
    expect(req.request.headers.get('Api-Key')).toBe('service-key-123');
    req.flush({ formatted_address: 'Tehran, Iran' });
  });

  it('should return null without HTTP request when neshanServiceApiKey is empty', () => {
    environment.neshanServiceApiKey = '';

    service.reverseGeocode(35.7, 51.3).subscribe((addr) => {
      expect(addr).toBeNull();
    });

    httpMock.expectNone('https://api.neshan.org/v2/reverse?lat=35.7&lng=51.3');
  });

  it('should call generateQrCode with POST and no request body', () => {
    const mockResponse = {
      code: 'test-code-123',
      expiresAtUtc: '2026-10-03T10:00:00Z',
    };

    service.generateQrCode('wl-999').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/work-locations/wl-999/qr`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(mockResponse);
  });
});
