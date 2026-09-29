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
   * into a Jalali date string in 'DD-MM-YYYY' format with Persian digits (e.g., '۱۵-۰۲-۱۴۰۵').
   */
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return this.persianDateService.toJalaliString(value);
  }
}
