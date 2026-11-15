export interface UpdateEmployeeDto {
  /** Omitted by the client so the backend resolves it from the caller's token. */
  organizationId?: string;
  personnelCode: string;
  nationalCode: string;
  birthDate: string;
  gender?: string;
  hireDate: string;
  isActive: boolean;
  profileImage?: File | null;
  removeProfileImage?: boolean;
}
