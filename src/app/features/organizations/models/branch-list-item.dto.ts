/**
 * `BranchListItemDto` — a center (branch) of an organization.
 *
 * Returned by `GET /api/organizations/{organizationId}/centers`,
 * `PUT /api/centers/{centerId}` and `PATCH /api/centers/{centerId}/status`.
 */
export interface BranchListItemDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
}
