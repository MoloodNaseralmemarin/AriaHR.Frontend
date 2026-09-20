import { Injectable } from '@angular/core';
import { toPersianDigits } from '../../shared/utils/mobile-number.util';

export interface PersianDateDetails {
  dayName: string;
  day: number;
  dayFormatted: string;
  monthName: string;
  year: number;
  yearFormatted: string;
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
  getRelativeTime(timestamp: string | Date | null | undefined, now: Date = new Date()): string {
    if (!timestamp) {
      return 'تاریخ نامعتبر';
    }

    let targetDate: Date;

    if (timestamp instanceof Date) {
      targetDate = timestamp;
    } else if (typeof timestamp === 'string') {
      const trimmed = timestamp.trim();
      if (!trimmed) {
        return 'تاریخ نامعتبر';
      }

      // Check if string already contains timezone offset (+hh:mm / -hh:mm) or 'Z'
      const hasTimezone = /[Zz]|\+[0-9]{2}:?[0-9]{2}$|-[0-9]{2}:?[0-9]{2}$/.test(trimmed);

      if (hasTimezone) {
        targetDate = new Date(trimmed);
      } else {
        // Timestamps without explicit timezone indicator in UTC fields (e.g. "2026-08-25T20:21:44.3713409")
        // append 'Z' to guarantee UTC parsing rather than local browser time parsing.
        targetDate = new Date(`${trimmed}Z`);
      }
    } else {
      return 'تاریخ نامعتبر';
    }

    const targetTime = targetDate.getTime();
    const nowTime = now.getTime();

    if (isNaN(targetTime)) {
      return 'تاریخ نامعتبر';
    }

    const diffInSeconds = Math.floor((nowTime - targetTime) / 1000);

    // If future timestamp (negative diff) or less than 60 seconds ago
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
}
