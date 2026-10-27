import { OrganizationType } from './organization-type.enum';

export interface CreateOrganizationDto {
  name: string;
  code: string;
  type: OrganizationType | number;
  organizationType?: OrganizationType | number;
  nationalIdentifier: string | null;
  phone: string | null;
  address: string | null;
  managerFirstName: string | null;
  managerLastName: string | null;
  managerMobile: string | null;
  managerEmail?: string | null;
  isActive: boolean;
}
