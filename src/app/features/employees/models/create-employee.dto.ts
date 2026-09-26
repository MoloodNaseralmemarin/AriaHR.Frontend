export interface CreateEmployeeDto {
  userId: string;
  organizationId: string;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  gender?: string;
  hireDate: string;
  profileImagePath?: string;
}
