/**
 * Request contract for creating an Employee.
 * `id` را شامل نمی‌شود (توسط بک‌اند تولید می‌شود).
 */
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
