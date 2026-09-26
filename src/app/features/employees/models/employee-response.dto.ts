export interface EmployeeResponseDto {
  id: string;
  userId: string;
  organizationId: string;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  gender?: string;
  hireDate: string;
  isActive: boolean;
  profileImagePath?: string;
  userFullName?: string;
  userEmail?: string;
}
