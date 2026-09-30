import { Pipe, PipeTransform, inject } from '@angular/core';
import { PersianDateService } from '../../core/services/persian-date.service';

@Pipe({
  name: 'jalali',
  standalone: true,
})
export class JalaliPipe implements PipeTransform {
  private readonly persianDateService = inject(PersianDateService);

  /**
   * Transforms a Gregorian date string (e.g., '2026-05-05') or ISO string
   * into a Jalali date string in 'DD-MM-YYYY' or 'YYYY-MM-DD' format with Persian or ASCII digits.
   */
  transform(
    value: string | null | undefined,
    digitsFormat: 'persian' | 'ascii' = 'persian',
    dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD' = 'DD-MM-YYYY'
  ): string {
    if (!value) return '';
    return this.persianDateService.toJalaliString(value, digitsFormat, dateFormat);
  }
}
