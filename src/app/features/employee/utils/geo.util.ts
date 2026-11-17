/**
 * Geolocation helpers used by the attendance workflow.
 *
 * The backend remains the final authority for geofence validation; these
 * helpers only provide local, informational calculations (distance display)
 * and basic coordinate sanity checks.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoValidationResult {
  valid: boolean;
  reason?: string;
}

const EARTH_RADIUS_METERS = 6_371_000;

/** Converts degrees to radians. */
function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Haversine great-circle distance between two points, in meters.
 * Returns null when either point is invalid.
 */
export function haversineDistanceMeters(
  from: GeoPoint,
  to: GeoPoint
): number | null {
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) {
    return null;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/** Basic sanity check for a latitude/longitude pair. */
export function isValidCoordinate(point: Partial<GeoPoint> | null | undefined): boolean {
  if (!point) return false;
  const { latitude, longitude } = point;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/** Validates a browser GeolocationPosition-like reading. */
export function validateGeolocationReading(reading: {
  coords?: { latitude?: number; longitude?: number; accuracy?: number } | null;
  timestamp?: number;
} | null): GeoValidationResult {
  if (!reading || !reading.coords) {
    return { valid: false, reason: 'موقعیت مکانی دریافت نشد.' };
  }

  const { latitude, longitude, accuracy } = reading.coords;
  if (!isValidCoordinate({ latitude: latitude as number, longitude: longitude as number })) {
    return { valid: false, reason: 'مختصات موقعیت مکانی معتبر نیست.' };
  }

  if (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0) {
    return { valid: false, reason: 'دقت موقعیت مکانی معتبر نیست.' };
  }

  if (typeof reading.timestamp !== 'number' || !Number.isFinite(reading.timestamp)) {
    return { valid: false, reason: 'زمان ثبت موقعیت مکانی معتبر نیست.' };
  }

  return { valid: true };
}

/** Formats a GeolocationPosition timestamp as a UTC ISO-8601 string. */
export function toUtcIsoTimestamp(timestamp: number | undefined | null): string {
  const ms = typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : Date.now();
  return new Date(ms).toISOString();
}