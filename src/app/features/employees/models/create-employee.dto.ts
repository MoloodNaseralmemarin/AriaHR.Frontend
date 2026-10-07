export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  hireDate: string;
  gender?: string | null;
  profileImage?: File | null;
  organizationId: string;
}
