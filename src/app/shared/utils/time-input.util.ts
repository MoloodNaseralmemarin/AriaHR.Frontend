import { toAsciiDigits } from './time.util';

export const TIME_INPUT_ERROR_MESSAGE =
  'ساعت وارد شده معتبر نیست. ساعت باید بین ۰۰ تا ۲۳ و دقیقه بین ۰۰ تا ۵۹ باشد.';

const TIME_24H_PATTERN = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

/** Keeps only up to four ASCII digits, normalizing Persian/Arabic-Indic digits. */
export function extractTimeDigits(raw?: string | null): string {
  return toAsciiDigits(raw).replace(/\D/g, '').slice(0, 4);
}

/** Inserts the colon automatically once the user has typed the hour digits. */
export function formatTimeDigits(digits: string): string {
  const clean = extractTimeDigits(digits);
  if (clean.length <= 2) {
    return clean;
  }
  return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

/**
 * Completes a partially typed time into `HH:mm`:
 * `7` → `07:00`, `73` → `73:00`, `730` → `07:30`, `1622` → `16:22`.
 * Range validity is checked separately by {@link isValidTime24h}.
 */
export function completeTimeDigits(digits: string): string {
  const clean = extractTimeDigits(digits);
  switch (clean.length) {
    case 0:
      return '';
    case 1:
      return `0${clean}:00`;
    case 2:
      return `${clean}:00`;
    case 3:
      return `0${clean.charAt(0)}:${clean.slice(1)}`;
    default:
      return `${clean.slice(0, 2)}:${clean.slice(2)}`;
  }
}

/** True only for a 24-hour time with hours 00–23 and minutes 00–59. */
export function isValidTime24h(value?: string | null): boolean {
  return TIME_24H_PATTERN.test(toAsciiDigits(value).trim());
}

/** Returns the normalized `HH:mm` value, or null when the input is not a valid time. */
export function normalizeTimeValue(value?: string | null): string | null {
  const digits = extractTimeDigits(value);
  if (!digits) {
    return null;
  }
  const completed = completeTimeDigits(digits);
  return isValidTime24h(completed) ? completed : null;
}
