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
}
