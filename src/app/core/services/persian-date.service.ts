import { Injectable } from '@angular/core';
import { toPersianDigits, normalizeMobileNumber, normalizePersianDigits } from '../../shared/utils/mobile-number.util';

export interface PersianDateDetails {
  dayName: string;
  day: number;
  dayFormatted: string;
  monthName: string;
  year: number;
  yearFormatted: string;
}

export interface JalaliDateObject {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDateObject {
  year: number;
  month: number;
  day: number;
}

@Injectable({
  providedIn: 'root',
})
export class PersianDateService {
  /**
   * Returns today's date formatted in Persian/Jalali style.
   * Example: "دوشنبه، ۴ شهریور ۱۴۰۳"
   */
  getTodayFormatted(): string {
    return this.formatDate(new Date());
  }

  /**
   * Returns today's detailed Persian/Jalali date components.
   */
  getTodayJalali(): PersianDateDetails {
    return this.getJalaliDetails(new Date());
  }

  /**
   * Formats a given JavaScript Date into Persian/Jalali calendar string format: "نام روز، روز ماه سال".
   * Example: "دوشنبه، ۴ شهریور ۱۴۰۳"
   */
  formatDate(date: Date): string {
    const details = this.getJalaliDetails(date);
    return `${details.dayName}، ${details.dayFormatted} ${details.monthName} ${details.yearFormatted}`;
  }

  /**
   * Extracts Jalali date components (day name, day number, month name, year) for any given Date.
   */
  getJalaliDetails(date: Date): PersianDateDetails {
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).formatToParts(date);

    let dayName = '';
    let monthName = '';
    let dayNum = 1;
    let yearNum = 1399;

    for (const part of parts) {
      if (part.type === 'weekday') {
        dayName = part.value;
      } else if (part.type === 'month') {
        monthName = part.value;
      } else if (part.type === 'day') {
        dayNum = parseInt(part.value, 10);
      } else if (part.type === 'year') {
        yearNum = parseInt(part.value, 10);
      }
    }

    return {
      dayName,
      day: dayNum,
      dayFormatted: toPersianDigits(dayNum),
      monthName,
      year: yearNum,
      yearFormatted: toPersianDigits(yearNum),
    };
  }

  /**
   * Calculates Persian relative time string for a given UTC timestamp or Date object.
   * Example outputs: "همین الان", "۱ دقیقه پیش", "۲ ساعت پیش", "۱ روز پیش", "۲ هفته پیش", "۱ ماه پیش", "۱ سال پیش".
   *
   * @param timestamp The creation timestamp (ISO string or Date).
   * @param now Optional reference date for deterministic testing (defaults to current date).
   */
  getRelativeTime(timestamp: string | Date, now: Date = new Date()): string {
    const targetDate = this.parseTimestamp(timestamp);
    const targetTime = targetDate ? targetDate.getTime() : NaN;
    const nowTime = now.getTime();

    if (isNaN(targetTime)) {
      return 'تاریخ نامعتبر';
    }

    const diffInSeconds = Math.floor((nowTime - targetTime) / 1000);

    if (diffInSeconds < 60) {
      return 'همین الان';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${toPersianDigits(diffInMinutes)} دقیقه پیش`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${toPersianDigits(diffInHours)} ساعت پیش`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${toPersianDigits(diffInDays)} روز پیش`;
    }

    if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${toPersianDigits(diffInWeeks)} هفته پیش`;
    }

    if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${toPersianDigits(diffInMonths)} ماه پیش`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${toPersianDigits(diffInYears)} سال پیش`;
  }

  private parseTimestamp(timestamp: string | Date): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }

    if (typeof timestamp !== 'string') {
      return new Date(NaN);
    }

    const trimmed = timestamp.trim();
    if (!trimmed) {
      return new Date(NaN);
    }

    const hasTimezone = /[Zz]|[+-]\d{2}(?::?\d{2})?$/.test(trimmed);
    const normalizedStr = hasTimezone ? trimmed : `${trimmed}Z`;

    return new Date(normalizedStr);
  }

  /**
   * Converts Gregorian year, month, day to Jalali date components.
   */
  gregorianToJalali(gy: number, gm: number, gd: number): JalaliDateObject {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days =
      365 * gy +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1];

    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    const jm =
      days < 186
        ? 1 + Math.floor(days / 31)
        : 7 + Math.floor((days - 186) / 30);
    const jd =
      1 + (days < 186 ? days % 31 : (days - 186) % 30);

    return { year: jy, month: jm, day: jd };
  }

  /**
   * Converts Jalali year, month, day to Gregorian date components.
   */
  jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDateObject {
    let gy = jy <= 979 ? 621 : 1600;
    jy -= jy <= 979 ? 0 : 979;
    let days =
      365 * jy +
      Math.floor(jy / 33) * 8 +
      Math.floor(((jy % 33) + 3) / 4) +
      78 +
      jd +
      (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

    gy += 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let gd = days + 1;
    const isLeapGregorian =
      (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    const sal_a = [
      0,
      31,
      isLeapGregorian ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    let gm = 0;
    for (gm = 0; gm < 13; gm++) {
      const v = sal_a[gm];
      if (gd <= v) break;
      gd -= v;
    }

    return { year: gy, month: gm, day: gd };
  }

  /**
   * Checks if a Jalali year is a leap year.
   */
  isJalaliLeapYear(jy: number): boolean {
    const g = this.jalaliToGregorian(jy, 12, 30);
    const j = this.gregorianToJalali(g.year, g.month, g.day);
    return j.year === jy && j.month === 12 && j.day === 30;
  }

  /**
   * Validates if the given Jalali year, month, and day constitute a valid date on the Jalali calendar.
   */
  isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
    if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return false;
    if (jy < 1000 || jy > 1600) return false;
    if (jm < 1 || jm > 12) return false;
    if (jd < 1) return false;

    if (jm <= 6) {
      return jd <= 31;
    } else if (jm <= 11) {
      return jd <= 30;
    } else {
      // Month 12 (Esfand)
      return this.isJalaliLeapYear(jy) ? jd <= 30 : jd <= 29;
    }
  }

  /**
   * Converts a Gregorian date string (e.g. "2026-05-05" or "2026-05-05T00:00:00Z")
   * to a Jalali date string in `DD-MM-YYYY` or `YYYY-MM-DD` format with Persian or ASCII digits.
   *
   * Avoids timezone shifting by extracting calendar date components strictly.
   */
  toJalaliString(
    gregorianStr: string | null | undefined,
    usePersianDigits: boolean | 'persian' | 'ascii' = true,
    dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD' = 'DD-MM-YYYY'
  ): string {
    if (!gregorianStr) return '';

    const str = String(gregorianStr).trim();
    if (!str) return '';

    // Match YYYY-MM-DD pattern directly from string to avoid timezone shifting
    const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    let gy: number, gm: number, gd: number;

    if (match) {
      gy = parseInt(match[1], 10);
      gm = parseInt(match[2], 10);
      gd = parseInt(match[3], 10);
    } else {
      const d = new Date(str);
      if (isNaN(d.getTime())) return '';
      // Fallback to UTC components
      gy = d.getUTCFullYear();
      gm = d.getUTCMonth() + 1;
      gd = d.getUTCDate();
    }

    if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return '';

    const j = this.gregorianToJalali(gy, gm, gd);
    const dayStr = String(j.day).padStart(2, '0');
    const monthStr = String(j.month).padStart(2, '0');
    const yearStr = String(j.year);

    const asciiJalali =
      dateFormat === 'YYYY-MM-DD'
        ? `${yearStr}-${monthStr}-${dayStr}`
        : `${dayStr}-${monthStr}-${yearStr}`;

    const isPersian =
      usePersianDigits === true || usePersianDigits === 'persian';

    return isPersian ? toPersianDigits(asciiJalali) : asciiJalali;
  }

  /**
   * Converts a Jalali date string (e.g. "15-02-1405" or "۱۵-۰۲-۱۴۰۵")
   * to a Gregorian date string in `YYYY-MM-DD` standard ASCII format (e.g. "2026-05-05").
   * Returns null if invalid.
   */
  toGregorianString(jalaliStr: string | null | undefined): string | null {
    if (!jalaliStr) return null;

    const asciiStr = normalizePersianDigits(String(jalaliStr).trim());
    if (!asciiStr) return null;

    // Accept DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD or YYYY/MM/DD
    const parts = asciiStr.split(/[-/]/);
    if (parts.length !== 3) return null;

    let jy: number, jm: number, jd: number;

    if (parts[0].length === 4) {
      // YYYY-MM-DD
      jy = parseInt(parts[0], 10);
      jm = parseInt(parts[1], 10);
      jd = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY
      jd = parseInt(parts[0], 10);
      jm = parseInt(parts[1], 10);
      jy = parseInt(parts[2], 10);
    }

    if (!this.isValidJalaliDate(jy, jm, jd)) return null;

    const g = this.jalaliToGregorian(jy, jm, jd);
    const gyStr = String(g.year).padStart(4, '0');
    const gmStr = String(g.month).padStart(2, '0');
    const gdStr = String(g.day).padStart(2, '0');

    return `${gyStr}-${gmStr}-${gdStr}`;
  }
}
