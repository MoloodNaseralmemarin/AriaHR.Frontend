/**
 * `CreateWorkLocationRequest` — body of `POST /api/WorkLocations/work-locations`.
 *
 * The organization is resolved from the caller's JWT on the server, so it must
 * never be sent from the client (a SystemAdmin supplies it separately through
 * the API, not through this screen).
 *
 * `name` and `allowedRadiusInMeters` (1..1000 by default) are required;
 * `latitude` and `longitude` are WGS-84 decimal degrees sent as numbers.
 *
 * QR configuration is not part of this contract: the backend creates a static,
 * enabled QR code by default, and the mode/rotation are configured afterwards
 * through the `/qrcode/settings` endpoints. Adding unknown members to this body
 * is rejected by the API.
 */
export interface CreateWorkLocationDto {
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
}
