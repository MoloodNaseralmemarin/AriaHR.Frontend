import { OrganizationType } from './organization-type.enum';

/**
 * `OrganizationListItemDto` — item of `GET /api/organizations` (SystemAdmin only).
 */
export interface OrganizationListItemDto {
  id: string;
  name: string;
  code: string;
  organizationType: OrganizationType;
  managerFullName?: string | null;
  managerMobile?: string | null;
  centerPhone?: string | null;
  isActive: boolean;
  createdAtUtc: string;
}
