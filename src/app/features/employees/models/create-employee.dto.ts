export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  hireDate: string;
  gender?: string | null;
  profileImage?: File | null;
  /** Omitted by the client so the backend resolves it from the caller's token. */
  organizationId?: string;
}
