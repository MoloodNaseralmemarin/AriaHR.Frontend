export interface RecentOrganizationDto {
  id: string | number;
  name: string;
  code?: string;
  type?: number;
  isActive?: boolean;
  managerFirstName?: string | null;
  managerLastName?: string | null;
  createdAt?: string;

  // Casing variations from backend JSON deserialization
  Id?: string | number;
  Name?: string;
  Code?: string;
  Type?: number;
  IsActive?: boolean;
  ManagerFirstName?: string | null;
  ManagerLastName?: string | null;
  CreatedAt?: string;
}
