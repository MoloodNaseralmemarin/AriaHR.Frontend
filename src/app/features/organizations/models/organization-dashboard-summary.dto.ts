export interface OrganizationDashboardSummaryDto {
  totalCenters?: number;
  activeCenters?: number;
  pendingCenters?: number;
  totalManagers?: number;
  totalEmployees?: number;
  newCentersThisMonth?: number;

  // Casing variations from backend JSON deserialization
  TotalCenters?: number;
  ActiveCenters?: number;
  PendingCenters?: number;
  TotalManagers?: number;
  TotalEmployees?: number;
  NewCentersThisMonth?: number;
}
