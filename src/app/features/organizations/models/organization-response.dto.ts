export interface OrganizationResponseDto {
  id: string | number;
  name: string;
  code: string;
  type: number;
  nationalIdentifier: string | null;
  phone: string | null;
  address: string | null;
  managerFirstName: string | null;
  managerLastName: string | null;
  managerMobile: string | null;
  isActive: boolean;
  createdAt?: string;
}
