/**
 * `CreateWorkLocationRequest` — body of `POST /api/organizations/work-locations`.
 *
 * The organization is resolved from the caller's JWT for a CenterManager; a
 * SystemAdmin must supply `organizationId`. `name` and `allowedRadiusInMeters`
 * (1..1000 by default) are required; QR fields are optional and default to a
 * static, enabled code server-side.
 */
export interface CreateWorkLocationDto {
  organizationId?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
}
