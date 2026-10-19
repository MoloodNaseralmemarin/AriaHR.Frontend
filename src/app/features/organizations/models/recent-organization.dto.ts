import { OrganizationType } from './organization-type.enum';

export interface RecentOrganizationDto {
  id: string | number;
  name: string;
  code?: string;
  type?: OrganizationType | number;
  isActive?: boolean;
  managerFirstName?: string | null;
  managerLastName?: string | null;
  createdAt?: string;

  // Casing variations from backend JSON deserialization
  Id?: string | number;
  Name?: string;
  Code?: string;
  Type?: OrganizationType | number;
  IsActive?: boolean;
  ManagerFirstName?: string | null;
  ManagerLastName?: string | null;
  CreatedAt?: string;
}
