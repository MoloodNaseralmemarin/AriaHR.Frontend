/**
 * Response contract for a single Employee, as returned by the backend.
 *
 * پایه‌ی این فیلدها دقیقاً از روی Entity زیر گرفته شده:
 * AriaHR.Modules.Organization.Domain.Entities.Employee
 *
 * ⚠️ GUESS — تأیید نشده:
 * - `id` از BaseEntity فرض شده (نوع دقیق BaseEntity دیده نشده؛ اگر Id از نوع
 *   number/int است، این فیلد و همه‌ی جاهایی که id به صورت string استفاده شده
 *   باید اصلاح شوند).
 * - `userFullName` و `userEmail` روی Entity وجود ندارند (چون UserId فقط ارجاع
 *   به ماژول Identity است، بدون Navigation Property). این دو فیلد صرفاً برای
 *   اینکه صفحه‌ی لیست/جزئیات بتواند اسم کارمند را نشان دهد اضافه شده‌اند و باید
 *   با کنترلر واقعی بک‌اند تطبیق داده شوند؛ در غیر این صورت باید حذف شوند.
 * - فرمت `birthDate` / `hireDate` به صورت رشته‌ی ISO (`YYYY-MM-DD`) فرض شده،
 *   چون DateOnly در System.Text.Json معمولاً همین‌طور سریالایز می‌شود.
 */
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

  // GUESS — تأیید نشده، به بخش بالا مراجعه کنید
  userFullName?: string;
  userEmail?: string;
}
