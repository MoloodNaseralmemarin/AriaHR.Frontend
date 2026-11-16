/**
 * `RecentOrganizationDto` — item of `GET /api/organizations/recent` (SystemAdmin only).
 */
export interface RecentOrganizationDto {
  id: string;
  name: string;
  createdAtUtc: string;
}
