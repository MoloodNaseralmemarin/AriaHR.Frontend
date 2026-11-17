import { getStatusFallbackMessage, parseApiError } from '../../../core/http/api-error.util';

export type WorkLocationSubmitAction = 'create' | 'update';

/** Form fields the work-location API can report validation errors for. */
export type WorkLocationField = 'name' | 'radiusInMeters' | 'latitude' | 'longitude';

/**
 * Backend validation errors of one submission, keyed by the Angular form field
 * they belong to. `general` carries errors for fields this form cannot render
 * (so no server message is ever swallowed).
 */
export type WorkLocationFieldErrors = Partial<Record<WorkLocationField, string>> & {
  general?: string;
};

/**
 * Turns any submission failure into one actionable Persian sentence.
 *
 * The backend's ProblemDetails message is preferred. Status-specific copy is
 * only used when the server sent a generic (or missing) message, so real
 * validation errors are never hidden.
 */
export function resolveWorkLocationSubmitError(
  error: unknown,
  action: WorkLocationSubmitAction
): string {
  const info = parseApiError(error);

  // ASP.NET Core validation failures arrive as English `errors` entries. Those
  // are rendered per field in Persian, so the summary line stays Persian too.
  const hasFieldErrors = Object.keys(info.fieldErrors).length > 0;
  if (
    hasFieldErrors &&
    (info.status === 400 || info.status === 422) &&
    // Letters only: the ASGI summary separator «؛» is itself in the Arabic
    // block, so a wide 0600-06FF range would misread English summaries.
    !/[\u0621-\u064A]/.test(info.message)
  ) {
    return 'اطلاعات محل کار معتبر نیست. مقادیر مشخص‌شده را اصلاح و دوباره تلاش کنید.';
  }

  if (info.message !== getStatusFallbackMessage(info.status)) {
    return info.message;
  }

  switch (info.status) {
    case 0:
      return 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.';
    case 400:
    case 422:
      return action === 'create'
        ? 'اطلاعات محل کار معتبر نیست. نام، موقعیت و شعاع محدوده را بررسی کنید.'
        : 'اطلاعات محل کار معتبر نیست. تغییرات را بررسی و دوباره ذخیره کنید.';
    case 403:
      return action === 'create'
        ? 'شما اجازهٔ ثبت محل کار برای این مرکز را ندارید.'
        : 'شما اجازهٔ ویرایش این محل کار را ندارید.';
    case 404:
      return action === 'create'
        ? 'مرکز سازمانی مورد نظر یافت نشد. لطفاً دوباره وارد حساب خود شوید.'
        : 'محل کار مورد نظر یافت نشد. ممکن است حذف شده باشد.';
    case 409:
      return 'محل کاری با این نام در این مرکز از قبل ثبت شده است.';
    default:
      return action === 'create'
        ? 'ثبت محل کار انجام نشد. لطفاً دوباره تلاش کنید.'
        : 'ذخیرهٔ تغییرات انجام نشد. لطفاً دوباره تلاش کنید.';
  }
}

/**
 * Maps the field keys of an ASP.NET Core `ProblemDetails.errors` object onto the
 * work-location form. Keys can arrive as `Name`, `$.name` or `request.Name`, so
 * only the last segment is compared, case- and punctuation-insensitively.
 */
const BACKEND_FIELD_ALIASES: Readonly<Record<string, WorkLocationField>> = {
  name: 'name',
  allowedradiusinmeters: 'radiusInMeters',
  radiusinmeters: 'radiusInMeters',
  latitude: 'latitude',
  longitude: 'longitude',
};

const RANGE_PATTERN = /between\s+(-?\d+(?:\.\d+)?)\s+and\s+(-?\d+(?:\.\d+)?)/i;
const MAX_LENGTH_PATTERN = /maximum length of\s+(\d+)/i;
const REQUIRED_PATTERN = /required|must not be empty|must not be null/i;
const NUMERIC_PATTERN = /must be a number|not a valid number|convert/i;

/**
 * Extracts the backend validation errors of a failed create/update call and
 * turns each one into a Persian message bound to its form field. The HTTP 400
 * `ProblemDetails.errors` payload is the only source, so server-side rules
 * (like the real radius range) are surfaced instead of hidden.
 */
export function resolveWorkLocationFieldErrors(error: unknown): WorkLocationFieldErrors {
  const { fieldErrors } = parseApiError(error);
  const result: WorkLocationFieldErrors = {};
  const unmapped: string[] = [];

  for (const [rawField, serverMessage] of Object.entries(fieldErrors)) {
    const field = BACKEND_FIELD_ALIASES[normalizeFieldKey(rawField)];
    if (field) {
      result[field] = translateFieldError(field, serverMessage);
    } else {
      unmapped.push(serverMessage);
    }
  }

  if (unmapped.length > 0) {
    result.general = [...new Set(unmapped)].join('؛ ');
  }

  return result;
}

function normalizeFieldKey(rawKey: string): string {
  const segments = rawKey.split('.').filter((segment) => segment.length > 0);
  const lastSegment = segments[segments.length - 1] ?? rawKey;
  return lastSegment.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

function translateFieldError(field: WorkLocationField, serverMessage: string): string {
  const range = RANGE_PATTERN.exec(serverMessage);

  switch (field) {
    case 'name': {
      const maxLength = MAX_LENGTH_PATTERN.exec(serverMessage);
      if (maxLength) {
        return `نام محل کار نمی‌تواند بیش از ${toPersianDigits(Number(maxLength[1]))} کاراکتر باشد.`;
      }
      if (REQUIRED_PATTERN.test(serverMessage)) {
        return 'نام محل کار الزامی است.';
      }
      return 'نام محل کار معتبر نیست.';
    }
    case 'radiusInMeters': {
      if (range) {
        return `شعاع محدوده باید بین ${toPersianDigits(Number(range[1]))} تا ${toPersianDigits(
          Number(range[2])
        )} متر باشد.`;
      }
      if (REQUIRED_PATTERN.test(serverMessage) || NUMERIC_PATTERN.test(serverMessage)) {
        return 'شعاع محدودهٔ مجاز باید یک عدد معتبر باشد.';
      }
      return 'شعاع محدودهٔ مجاز معتبر نیست.';
    }
    case 'latitude': {
      const persianRange = range
        ? ` بین ${toPersianDigits(Number(range[1]))} تا ${toPersianDigits(Number(range[2]))} درجه`
        : '';
      return `عرض جغرافیایی معتبر نیست؛ باید یک عدد${persianRange} باشد.`;
    }
    case 'longitude': {
      const persianRange = range
        ? ` بین ${toPersianDigits(Number(range[1]))} تا ${toPersianDigits(Number(range[2]))} درجه`
        : '';
      return `طول جغرافیایی معتبر نیست؛ باید یک عدد${persianRange} باشد.`;
    }
    default:
      return 'مقدار وارد شده معتبر نیست.';
  }
}

function toPersianDigits(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('fa-IR') : String(value);
}
