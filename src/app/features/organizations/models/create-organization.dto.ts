import { OrganizationType } from './organization-type.enum';

/**
 * `CreateOrganizationRequest` — body of `POST /api/organizations`.
 *
 * `name`, `code`, both manager names, `managerMobile` and `managerEmail` are
 * required by the backend; `type` is the numeric `OrganizationType`.
 */
export interface CreateOrganizationDto {
  name: string;
  code: string;
  type: OrganizationType;
  nationalIdentifier: string | null;
  phone: string | null;
  address: string | null;
  managerFirstName: string;
  managerLastName: string;
  managerMobile: string;
  managerEmail: string;
  isActive: boolean;
}
