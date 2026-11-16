import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorInfo, ProblemDetailsDto } from './api-error.model';

const PERSIAN_TEXT_PATTERN = /[\u0600-\u06FF]/;
const TECH_MARKERS = /exception|stack trace|traceback|\bat\s+[\w$.]+\s*\(/i;
const GENERIC_HTTP_TEXT =
  /^(internal server error|bad request|bad gateway|unauthorized|forbidden|not found|conflict|gateway|service unavailable|one or more validation errors occurred\.?)$/i;

const MAX_MESSAGE_LENGTH = 400;
const MAX_FIELD_MESSAGE_LENGTH = 200;
const MAX_FIELD_ERRORS_IN_MESSAGE = 3;

const STATUS_FALLBACK_MESSAGES: Readonly<Record<number, string>> = {
  0: 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.',
  400: 'اطلاعات ارسالی نامعتبر است. لطفاً مقادیر فرم را بررسی و اصلاح کنید.',
  401: 'نشست شما منقضی شده است. لطفاً دوباره وارد حساب خود شوید.',
  403: 'شما دسترسی لازم برای انجام این عملیات را ندارید.',
  404: 'اطلاعاتی که درخواست کردید یافت نشد.',
  409: 'این عملیات با اطلاعات موجود در سیستم مغایرت دارد.',
  422: 'اطلاعات ارسالی نامعتبر است. لطفاً مقادیر فرم را بررسی و اصلاح کنید.',
  429: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  500: 'خطایی در سرور رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.',
  502: 'سرور در حال حاضر در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.',
  503: 'سرور در حال حاضر در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.',
  504: 'پاسخی از سرور دریافت نشد. لطفاً کمی بعد دوباره تلاش کنید.',
};

const DEFAULT_FALLBACK_MESSAGE = 'عملیات انجام نشد. لطفاً دوباره تلاش کنید.';

type ErrorBody = Partial<ProblemDetailsDto> & { message?: unknown };

/** Persian fallback shown when the backend did not supply a usable message. */
export function getStatusFallbackMessage(status: number): string {
  const known = STATUS_FALLBACK_MESSAGES[status];
  if (known) {
    return known;
  }
  if (status >= 500) {
    return STATUS_FALLBACK_MESSAGES[500];
  }
  return DEFAULT_FALLBACK_MESSAGE;
}

/**
 * Extracts the title, detail, HTTP status and validation errors from any
 * thrown error (ASP.NET Core ProblemDetails, legacy `{ message }` envelopes,
 * plain string bodies or network failures) and returns one Persian message
 * that is safe to display to the end user.
 *
 * Raw JSON, HTML error pages and technical stack traces are never surfaced.
 */
export function parseApiError(error: unknown): ApiErrorInfo {
  const status = resolveStatus(error);
  const body = resolveErrorBody(error);
  const problem = toProblemDetails(body);
  const fieldErrors = extractFieldErrors(problem?.errors);

  const title = cleanUserText(problem?.title);
  const detail = cleanUserText(problem?.detail);
  const legacyMessage = cleanUserText(problem?.message);
  const stringBody = typeof body === 'string' ? cleanUserText(body) : null;

  const candidates = [
    detail,
    legacyMessage,
    title,
    stringBody,
    summarizeFieldErrors(fieldErrors),
  ];

  const fallback = getStatusFallbackMessage(status);
  let message = fallback;
  for (const candidate of candidates) {
    if (candidate && isUserFacingText(candidate)) {
      message = candidate;
      break;
    }
  }

  return {
    status,
    title,
    detail,
    fieldErrors,
    message: truncate(message, MAX_MESSAGE_LENGTH),
  };
}

/**
 * Convenience helper for components: returns the backend message when it is
 * usable and the supplied fallback otherwise.
 */
export function resolveApiErrorMessage(error: unknown, fallback?: string): string {
  const info = parseApiError(error);
  if (info.message === getStatusFallbackMessage(info.status) && fallback) {
    return fallback;
  }
  return info.message;
}

function resolveStatus(error: unknown): number {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }
  if (isRecord(error) && typeof error['status'] === 'number') {
    return error['status'];
  }
  return -1;
}

function resolveErrorBody(error: unknown): unknown {
  if (error instanceof HttpErrorResponse) {
    return error.error;
  }
  if (isRecord(error) && 'error' in error) {
    return error['error'];
  }
  return null;
}

function toProblemDetails(body: unknown): ErrorBody | null {
  if (!body || typeof body !== 'object' || body instanceof Error || Array.isArray(body)) {
    return null;
  }
  return body as ErrorBody;
}

function extractFieldErrors(errors: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return result;
  }

  for (const [field, rawValue] of Object.entries(errors as Record<string, unknown>)) {
    const candidate = Array.isArray(rawValue)
      ? rawValue.find((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      : rawValue;

    if (typeof candidate === 'string') {
      const message = cleanUserText(candidate);
      if (message) {
        result[field] = truncate(message, MAX_FIELD_MESSAGE_LENGTH);
      }
    }
  }

  return result;
}

function summarizeFieldErrors(fieldErrors: Record<string, string>): string | null {
  const messages = [...new Set(Object.values(fieldErrors).filter(Boolean))];
  if (messages.length === 0) {
    return null;
  }
  return messages.slice(0, MAX_FIELD_ERRORS_IN_MESSAGE).join('؛ ');
}

/** Strips markup/JSON and collapses whitespace; returns null for unusable text. */
function cleanUserText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || /^[{[<]/.test(text)) {
    return null;
  }

  return text;
}

/**
 * True when the text is meaningful for a Persian user and is not a technical
 * or generic HTTP message. Persian messages are always accepted.
 */
function isUserFacingText(text: string): boolean {
  if (PERSIAN_TEXT_PATTERN.test(text)) {
    return true;
  }
  if (GENERIC_HTTP_TEXT.test(text) || TECH_MARKERS.test(text)) {
    return false;
  }
  return text.length <= 160 && !/[{}[\]]/.test(text);
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
