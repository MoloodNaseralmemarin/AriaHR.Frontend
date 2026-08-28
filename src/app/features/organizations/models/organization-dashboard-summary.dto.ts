export interface OrganizationDashboardSummaryDto {
  readonly totalCenters: number;
  readonly activeCenters: number;
  readonly pendingCenters?: number;
  readonly totalManagers: number;
  readonly totalEmployees: number;
  readonly newCentersThisMonth: number;
}
