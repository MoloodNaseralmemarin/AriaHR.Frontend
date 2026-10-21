import { OrganizationType } from './organization-type.enum';

export interface OrganizationResponseDto {
  id: string | number;
  organizationId?: string | number | null;
  name: string;
  code?: string | null;
  organizationType?: OrganizationType | string | number;
  type?: OrganizationType | string | number;
  managerFullName?: string | null;
  managerFirstName?: string | null;
  managerLastName?: string | null;
  managerMobile?: string | null;
  centerPhone?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAtUtc?: string | null;
  createdAt?: string | null;
  nationalIdentifier?: string | null;
  address?: string | null;
}
