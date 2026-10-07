export interface UpdateEmployeeDto {
  organizationId: string;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  gender?: string;
  hireDate: string;
  isActive: boolean;
  profileImage?: File | null;
  removeProfileImage?: boolean;
}
