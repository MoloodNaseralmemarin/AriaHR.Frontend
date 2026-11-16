import { parseApiError } from '../../../core/http/api-error.util';

/**
 * Stable `AttendanceErrorCodes` returned by `POST /api/attendance/scan`
 * (in the response `code` field) and, for leave restrictions, in the
 * ProblemDetails `errorCode` extension of check-in/check-out.
 */
const CODE_MESSAGES: Readonly<Record<string, string>> = {
  QR_CODE_INVALID: 'کد QR معتبر نیست. لطفاً کد محل کار را دوباره اسکن کنید.',
  QR_CODE_EXPIRED: 'کد QR منقضی شده است. لطفاً کد جدید محل کار را اسکن کنید.',
  QR_CODE_DISABLED: 'کد QR این محل کار غیرفعال است. با مدیر مرکز تماس بگیرید.',
  WORK_LOCATION_NOT_FOUND: 'محل کار مرتبط با این کد QR یافت نشد.',
  WORK_LOCATION_INACTIVE: 'این محل کار غیرفعال است و ثبت تردد در آن امکان‌پذیر نیست.',
  EMPLOYEE_NOT_FOUND: 'اطلاعات کارمندی برای حساب شما ثبت نشده است.',
  EMPLOYEE_NOT_AUTHORIZED: 'شما مجاز به ثبت تردد در این محل کار نیستید.',
  LOCATION_UNAVAILABLE: 'موقعیت مکانی شما دریافت نشد. دسترسی GPS را فعال و دوباره تلاش کنید.',
  LOCATION_COORDINATES_INVALID: 'مختصات موقعیت مکانی ارسال‌شده معتبر نیست.',
  LOCATION_ACCURACY_INSUFFICIENT:
    'دقت موقعیت مکانی کافی نیست. لطفاً در فضای باز قرار بگیرید و دوباره تلاش کنید.',
  LOCATION_DATA_EXPIRED: 'اطلاعات موقعیت مکانی قدیمی است. موقعیت خود را به‌روزرسانی و دوباره تلاش کنید.',
  LOCATION_TIMESTAMP_INVALID: 'زمان ثبت موقعیت مکانی معتبر نیست. دوباره تلاش کنید.',
  OUTSIDE_ALLOWED_RADIUS: 'شما خارج از محدوده مجاز محل کار هستید. لطفاً در محل کار حضور داشته باشید.',
  SHIFT_VALIDATION_FAILED: 'زمان ثبت تردد با شیفت کاری شما هم‌خوانی ندارد.',
  DUPLICATE_ATTENDANCE: 'برای امروز ورود فعال ثبت شده است. ابتدا خروج ثبت کنید.',
  INVALID_ATTENDANCE_ACTION: 'تردد ورودی فعالی برای ثبت خروج یافت نشد.',
  IDEMPOTENCY_KEY_REUSED: 'این درخواست قبلاً ثبت شده است و مجدداً ثبت نشد.',
  ATTENDANCE_BLOCKED_BY_APPROVED_LEAVE: 'امکان ثبت تردد در بازه مرخصی تأییدشده وجود ندارد.',
  ATTENDANCE_REGISTERED: 'تردد شما با موفقیت ثبت شد.',
  INVALID_REQUEST: 'اطلاعات ارسالی نامعتبر است. لطفاً دوباره تلاش کنید.',
};

interface AttendanceErrorBody {
  code?: unknown;
  errorCode?: unknown;
  message?: unknown;
  detail?: unknown;
}

/**
 * Extracts the backend attendance error code from either the scan envelope
 * (`code`) or a ProblemDetails response (`errorCode` extension).
 */
export function getAttendanceErrorCode(error: unknown): string | null {
  const body = (error as { error?: unknown } | null)?.error;
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as AttendanceErrorBody;
  const code = record.code ?? record.errorCode;
  return typeof code === 'string' && code.trim() ? code.trim() : null;
}

/**
 * Persian, user-facing message for an attendance failure.
 *
 * Known backend codes win, then the backend `message`/`detail`/`title`
 * (via the centralized parser), then the status fallback. Raw JSON is never
 * returned.
 */
export function resolveAttendanceErrorMessage(error: unknown): string {
  const code = getAttendanceErrorCode(error);
  if (code && CODE_MESSAGES[code]) {
    return CODE_MESSAGES[code];
  }

  return parseApiError(error).message;
}
