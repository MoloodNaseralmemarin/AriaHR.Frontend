/**
 * Utilities for normalizing and validating Iranian mobile numbers.
 *
 * Accepts input typed with Persian (۰-۹) or Arabic-Indic (٠-٩) digits and
 * normalizes it to standard ASCII digits before validation, since users on
 * Persian keyboards frequently type native-script digits.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Converts Persian/Arabic-Indic digits to ASCII and strips everything else non-numeric. */
export function normalizeMobileNumber(raw: string): string {
  if (!raw) {
    return '';
  }

  let result = '';
  for (const char of raw) {
    const persianIndex = PERSIAN_DIGITS.indexOf(char);
    const arabicIndex = ARABIC_DIGITS.indexOf(char);

    if (persianIndex !== -1) {
      result += String(persianIndex);
    } else if (arabicIndex !== -1) {
      result += String(arabicIndex);
    } else if (char >= '0' && char <= '9') {
      result += char;
    }
    // Any other character (spaces, dashes, +98 prefix remnants, letters) is dropped.
  }

  // Normalize common "+98" / "0098" country-code prefixes to the local 09... form.
  if (result.startsWith('0098')) {
    result = '0' + result.slice(4);
  } else if (result.startsWith('98') && result.length === 12) {
    result = '0' + result.slice(2);
  }

  return result;
}

const IRAN_MOBILE_REGEX = /^09\d{9}$/;

/** Returns true only for exactly 11 digits, starting with 09. */
export function isValidIranianMobile(normalized: string): boolean {
  return IRAN_MOBILE_REGEX.test(normalized);
}

/** Converts ASCII digits (0-9) in a string to Persian digits (۰-۹). */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) {
    return '';
  }
  const str = String(input);
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}
