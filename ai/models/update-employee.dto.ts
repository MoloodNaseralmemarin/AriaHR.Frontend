/**
 * Request contract for updating an Employee.
 *
 * GUESS — تأیید نشده: `userId` عمداً از این DTO حذف شده، چون فرض شده هویت
 * کاربر (UserId) بعد از ایجاد کارمند قابل تغییر نیست. اگر بک‌اند اجازه‌ی
 * تغییر UserId را می‌دهد، این فیلد باید اضافه شود.
 */
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
