import { QrCodeMode } from './qr-code-settings.dto';

/**
 * `WorkLocationDto` — response of the `/api/organizations/work-locations` endpoints.
 *
 * Coordinates are stored as `decimal(9,6)` and the radius as `decimal(8,1)`;
 * `qrCodeMode` is serialized as a string (`Static` | `Dynamic`).
 */
export interface WorkLocationResponseDto {
  id: string;
  organizationId: string;
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
  qrCodeMode: QrCodeMode;
  qrCodeEnabled: boolean;
  qrRotationIntervalMinutes: number;
  qrCodeLastGeneratedAtUtc?: string | null;
  createdAtUtc: string;
  createdByUserId?: string | null;
  updatedAtUtc?: string | null;
  updatedByUserId?: string | null;
}

/** Response of Neshan Reverse Geocoding v5 (https://api.neshan.org/v5/reverse). */
export interface NeshanReverseGeocodeResponse {
  status?: string;
  formatted_address?: string;
  address?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
  district?: string;
  county?: string;
  region?: string;
  municipality_zone?: string;
  route_name?: string;
  route_type?: string;
  place?: string;
}
