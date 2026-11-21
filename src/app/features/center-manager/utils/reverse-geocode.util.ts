import { HttpErrorResponse } from '@angular/common/http';

/**
 * Why a Neshan reverse-geocoding call could not produce an address.
 *
 * The Neshan v5 reverse service answers errors with an HTTP status and a JSON
 * `code` that are identical (for example 484 `ApiWhiteListError`). Keeping the
 * distinction lets the map show what actually happened (key type, key scope,
 * quota, network, ...) instead of a single "address unavailable" message that
 * hides a broken deployment.
 */
export type ReverseGeocodeFailureReason =
  | 'not-configured'
  | 'invalid-coordinates'
  | 'invalid-argument'
  | 'missing-key'
  | 'quota-exceeded'
  | 'rate-limited'
  | 'key-type-mismatch'
  | 'key-scope-mismatch'
  | 'service-not-enabled'
  | 'provider-error'
  | 'network'
  | 'unexpected';

export interface ReverseGeocodeFailure {
  reason: ReverseGeocodeFailureReason;
  /** Neshan error code or HTTP status; null when the failure is client-side. */
  code: number | null;
  /** Raw provider message, kept for console/support diagnostics only. */
  detail: string | null;
}

export class ReverseGeocodeError extends Error {
  readonly failure: ReverseGeocodeFailure;

  constructor(failure: ReverseGeocodeFailure) {
    super(failure.detail ?? failure.reason);
    this.name = 'ReverseGeocodeError';
    this.failure = failure;
  }
}

export const REVERSE_GEOCODING_NOT_CONFIGURED_MESSAGE =
  'سرویس تبدیل موقعیت به آدرس فعال نیست؛ کلید سرویس نقشه نشان (Reverse Geocoding) تنظیم نشده است.';

/** Documented Neshan service error codes (https://platform.neshan.org/docs). */
const NESHAN_FAILURE_REASONS: Readonly<Record<number, ReverseGeocodeFailureReason>> = {
  400: 'invalid-argument',
  429: 'rate-limited',
  470: 'invalid-coordinates',
  480: 'missing-key',
  481: 'quota-exceeded',
  482: 'rate-limited',
  483: 'key-type-mismatch',
  484: 'key-scope-mismatch',
  485: 'service-not-enabled',
  500: 'provider-error',
};

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Normalizes any error thrown while resolving an address into a typed failure.
 * Accepts an already typed `ReverseGeocodeError`, an `HttpErrorResponse` from
 * the Neshan request, or an arbitrary thrown value.
 */
export function toReverseGeocodeFailure(error: unknown): ReverseGeocodeFailure {
  if (error instanceof ReverseGeocodeError) {
    return error.failure;
  }

  const status = readStatus(error);
  const detail = readDetail(error);
  const code = readProviderCode(error) ?? status;

  // HttpClient reports transport/CORS failures as status 0.
  if (status === 0) {
    return { reason: 'network', code: 0, detail };
  }

  if (code !== null) {
    const reason = NESHAN_FAILURE_REASONS[code];
    if (reason) {
      return { reason, code, detail };
    }
  }

  if (status !== null && status >= 500) {
    return { reason: 'provider-error', code: status, detail };
  }

  return { reason: 'unexpected', code, detail };
}

/**
 * One actionable Persian sentence for a failed conversion. `hostname` is the
 * page the user is on; it is only used to make the key-scope message concrete.
 */
export function describeReverseGeocodeFailure(
  failure: ReverseGeocodeFailure,
  hostname?: string | null
): string {
  switch (failure.reason) {
    case 'not-configured':
      return REVERSE_GEOCODING_NOT_CONFIGURED_MESSAGE;
    case 'invalid-coordinates':
      return 'مختصات انتخاب‌شده معتبر نیست؛ لطفاً دوباره نقطهٔ مورد نظر را روی نقشه انتخاب کنید.';
    case 'invalid-argument':
      return 'سرویس تبدیل موقعیت به آدرس این مختصات را نپذیرفت (خطای ۴۰۰)؛ لطفاً نقطهٔ دیگری انتخاب کنید.';
    case 'missing-key':
      return 'کلید سرویس نقشه نشان معتبر نیست (خطای ۴۸۰)؛ کلید Reverse Geocoding را بررسی کنید.';
    case 'quota-exceeded':
      return 'سهمیهٔ استفاده از سرویس تبدیل موقعیت به آدرس نقشه نشان تمام شده است (خطای ۴۸۱).';
    case 'rate-limited':
      return 'تعداد درخواست‌های تبدیل موقعیت به آدرس بیش از حد مجاز است (خطای ۴۸۲)؛ کمی بعد دوباره تلاش کنید.';
    case 'key-type-mismatch':
      return 'کلید تنظیم‌شده از نوع نقشه (Web Map) است و برای سرویس تبدیل موقعیت به آدرس معتبر نیست (خطای ۴۸۳)؛ باید از کلید «سرویس‌ها» با دسترسی Reverse Geocoding استفاده شود.';
    case 'key-scope-mismatch': {
      const host = hostname ? ` (${hostname})` : '';
      return `دامنهٔ جاری${host} در فهرست دامنه‌ها یا IPهای مجاز کلید سرویس نقشه نشان نیست (خطای ۴۸۴)؛ این دامنه را در پنل نشان به کلید Reverse Geocoding اضافه کنید.`;
    }
    case 'service-not-enabled':
      return 'دسترسی سرویس Reverse Geocoding برای این کلید فعال نشده است (خطای ۴۸۵)؛ در پنل نشان این سرویس را برای کلید فعال کنید.';
    case 'provider-error':
      return 'سرویس نقشه نشان در حال حاضر پاسخ نمی‌دهد؛ لطفاً کمی بعد دوباره تلاش کنید.';
    case 'network':
      return 'ارتباط با سرویس نقشه نشان برقرار نشد؛ اتصال اینترنت یا مسدودکننده‌های مرورگر را بررسی کنید.';
    default:
      return failure.code === null
        ? 'تبدیل موقعیت به آدرس انجام نشد؛ لطفاً دوباره تلاش کنید.'
        : `تبدیل موقعیت به آدرس انجام نشد (کد خطا: ${toPersianDigits(failure.code)}).`;
  }
}

function readStatus(error: unknown): number | null {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }
  if (isRecord(error) && typeof error['status'] === 'number') {
    return error['status'];
  }
  return null;
}

function readProviderCode(error: unknown): number | null {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (isRecord(body) && typeof body['code'] === 'number') {
      return body['code'];
    }
  }
  return null;
}

function readDetail(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (isRecord(body) && typeof body['message'] === 'string') {
      return body['message'];
    }
    if (typeof body === 'string' && body.trim()) {
      return body.trim().slice(0, 200);
    }
    return null;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return null;
}

function toPersianDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
