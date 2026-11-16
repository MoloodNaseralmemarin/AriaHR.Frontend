/**
 * `CreateWorkLocationRequest` — body of `POST /api/WorkLocations/work-locations`.
 *
 * The organization is resolved from the caller's JWT for a CenterManager; a
 * SystemAdmin must supply `organizationId`. `name` and `allowedRadiusInMeters`
 * (1..1000 by default) are required. The backend creates a static, enabled QR
 * code by default; it is configured afterwards through the `/qrcode/settings`
 * endpoints instead of this payload.
 */
export interface CreateWorkLocationDto {
  organizationId?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
}
