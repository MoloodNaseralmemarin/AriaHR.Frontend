export interface DashboardOverviewResponse {
  centers: {
    totalCount: number;
    activeCount: number;
    awaitingCompletionCount: number;
  };
  centerManagers: {
    totalCount: number;
  };
  employees: {
    totalCount: number;
    createdThisMonth: number;
  };
}
