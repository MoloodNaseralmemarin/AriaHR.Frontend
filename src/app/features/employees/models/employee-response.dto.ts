export interface EmployeeResponseDto {
  id: string;
  userId: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  hireDate: string;
  gender?: string | null;
  isActive: boolean;
  profileImagePath?: string | null;
  createdAtUtc?: string | null;
  createdByUserId?: string | null;
}
