const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Normalizes Persian and Arabic-Indic digits to ASCII digits.
 */
function toAsciiDigits(raw?: string | null): string {
  if (!raw) return '';
  let result = '';
  for (const char of String(raw)) {
    const pIdx = PERSIAN_DIGITS.indexOf(char);
    const aIdx = ARABIC_DIGITS.indexOf(char);
    if (pIdx !== -1) {
      result += String(pIdx);
    } else if (aIdx !== -1) {
      result += String(aIdx);
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Safely parses a raw time string (e.g., "08:30:00", "8:30", "۰۸:۳۰:۰۰") and formats it as "HH:mm".
 * Returns null if the input is empty, null, undefined, or invalid.
 */
export function formatTime(rawTime?: string | null): string | null {
  if (!rawTime) return null;

  const ascii = toAsciiDigits(rawTime).trim();
  if (!ascii) return null;

  // Match H:m or HH:mm or HH:mm:ss
  const match = ascii.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');

  return `${hStr}:${mStr}`;
}

/**
 * Formats start and end times into a standard "HH:mm - HH:mm" time range string.
 * Returns fallback (default: 'تعیین نشده') if either start or end time is missing or invalid.
 */
export function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
  fallback = 'تعیین نشده'
): string {
  const formattedStart = formatTime(startTime);
  const formattedEnd = formatTime(endTime);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }

  return fallback;
}
