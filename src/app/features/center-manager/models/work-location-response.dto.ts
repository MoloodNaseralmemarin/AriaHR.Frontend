/**
 * Response of `POST /api/organizations/work-locations`.
 *
 * The backend returns the persisted location, including the server-generated
 * `id`, UTC creation timestamp and the id of the authenticated creator. The
 * organization is always resolved server-side from the caller's token; the
 * request body's `organizationId` only names the target center.
 */
export interface WorkLocationResponseDto {
  id?: string;
  organizationId?: string;
  latitude?: number;
  longitude?: number;
  radiusInMeters?: number;
  isActive?: boolean;
  /** UTC creation timestamp, e.g. "2026-11-14T19:41:07.889Z". */
  createdAtUtc?: string;
  /** Authenticated creator, or null when the record was created by a system process. */
  createdByUserId?: string | null;
  /** Legacy alias kept for payloads that predate `createdAtUtc`. */
  createdAt?: string;
  updatedAt?: string;
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
