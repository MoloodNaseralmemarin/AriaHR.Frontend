import { OrganizationType } from './organization-type.enum';

/**
 * `OrganizationDto` — response of `POST /api/organizations`.
 *
 * The backend persists the manager contact data on the organization and
 * exposes `type` as an alias of `organizationType`, so both are present.
 */
export interface OrganizationResponseDto {
  id: string;
  name: string;
  code: string;
  nationalIdentifier?: string | null;
  phone?: string | null;
  address?: string | null;
  managerFirstName?: string | null;
  managerLastName?: string | null;
  managerMobile?: string | null;
  isActive: boolean;
  organizationType: OrganizationType;
  type: OrganizationType;
  createdAtUtc: string;
  createdByUserId?: string | null;
}
