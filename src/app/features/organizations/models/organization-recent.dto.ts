export interface OrganizationRecentDto {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
  readonly type?: number | string;
  readonly managerName?: string;
  readonly managerFirstName?: string;
  readonly managerLastName?: string;
  readonly employeeCount?: number;
  readonly status?: string;
  readonly isActive?: boolean;
  readonly createdAt: string;
}
