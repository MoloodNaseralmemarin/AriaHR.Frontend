/**
 * `OrganizationsDashboardSummaryResponse` — response of
 * `GET /api/organizations/dashboard-summary` (SystemAdmin only).
 *
 * The current backend returns only the center-manager count.
 */
export interface OrganizationDashboardSummaryDto {
  centerManagerCount: number;
}
