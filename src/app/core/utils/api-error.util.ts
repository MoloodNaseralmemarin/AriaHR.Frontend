import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetailsBody {
  title?: unknown;
  detail?: unknown;
  message?: unknown;
  errors?: Record<string, unknown>;
}

/**
 * Extracts a user-facing message from an API failure.
 *
 * The backend reports RFC 7807 `ProblemDetails` (`title`, `detail` and an
 * `errorCode` extension) for business and validation failures. Reading only
 * `error.message` — which Angular leaves undefined for HTTP failures — used to
 * hide the server's Persian explanation behind a generic fallback.
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    const body = (error as { error?: unknown } | null)?.error;
    const message = readMessage(body);
    return message ?? fallback;
  }

  if (error.status === 0) {
    return 'ارتباط با سرور برقرار نشد. اتصال اینترنت یا دسترسی به سرویس را بررسی کنید.';
  }
  if (error.status === 401) {
    return 'نشست شما منقضی شده است. لطفاً دوباره وارد حساب خود شوید.';
  }
  if (error.status === 403) {
    return 'شما اجازهٔ انجام این عملیات را ندارید.';
  }
  if (error.status === 404) {
    return readMessage(error.error) ?? 'مورد درخواستی یافت نشد.';
  }
  if (error.status === 409) {
    return readMessage(error.error) ?? 'این عملیات با وضعیت فعلی سرویس سازگار نیست.';
  }

  const serverMessage = readMessage(error.error);
  if (serverMessage) {
    return serverMessage;
  }

  if (error.status >= 500) {
    return 'خطا در سرور رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.';
  }

  return fallback;
}

function readMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object' || body instanceof Error) {
    return null;
  }

  const record = body as ProblemDetailsBody;

  for (const candidate of [record.detail, record.message, record.title]) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (record.errors && typeof record.errors === 'object') {
    for (const value of Object.values(record.errors)) {
      if (Array.isArray(value)) {
        const first = value.find((item): item is string => typeof item === 'string' && !!item.trim());
        if (first) {
          return first.trim();
        }
      } else if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}
