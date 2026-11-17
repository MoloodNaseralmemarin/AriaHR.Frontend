import '@angular/compiler';
import { describe, it, expect } from 'vitest';

import { haversineDistanceMeters, isValidCoordinate, validateGeolocationReading, toUtcIsoTimestamp } from './geo.util';

describe('geo.util', () => {
  it('computes haversine distance', () => {
    const d = haversineDistanceMeters({ latitude: 35.6892, longitude: 51.389 }, { latitude: 35.6892, longitude: 51.389 });
    expect(d).toBeCloseTo(0, 5);
  });

  it('returns null for invalid coords', () => {
    expect(haversineDistanceMeters({ latitude: 200, longitude: 0 }, { latitude: 0, longitude: 0 })).toBeNull();
  });

  it('validates coordinate ranges', () => {
    expect(isValidCoordinate({ latitude: 35, longitude: 51 })).toBe(true);
    expect(isValidCoordinate({ latitude: 91, longitude: 51 })).toBe(false);
    expect(isValidCoordinate({ latitude: 35, longitude: 181 })).toBe(false);
  });

  it('validates geolocation reading', () => {
    const r = validateGeolocationReading({ coords: { latitude: 35, longitude: 51, accuracy: 10 }, timestamp: Date.now() });
    expect(r.valid).toBe(true);
    const bad = validateGeolocationReading({ coords: { latitude: 200, longitude: 51, accuracy: 10 }, timestamp: Date.now() });
    expect(bad.valid).toBe(false);
  });

  it('converts timestamp to UTC ISO', () => {
    const iso = toUtcIsoTimestamp(1763281800000);
    expect(iso).toBe(new Date(1763281800000).toISOString());
  });
});