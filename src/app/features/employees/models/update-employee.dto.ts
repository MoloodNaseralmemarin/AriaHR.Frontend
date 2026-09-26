export interface UpdateEmployeeDto {
  organizationId: string;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  gender?: string;
  hireDate: string;
  isActive: boolean;
  profileImagePath?: string;
}
