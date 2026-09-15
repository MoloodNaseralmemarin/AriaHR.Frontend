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
}
