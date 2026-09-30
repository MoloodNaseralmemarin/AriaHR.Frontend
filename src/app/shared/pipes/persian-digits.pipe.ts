import { Pipe, PipeTransform } from '@angular/core';
import { toPersianDigits } from '../utils/mobile-number.util';

@Pipe({
  name: 'persianDigits',
  standalone: true,
})
export class PersianDigitsPipe implements PipeTransform {
  /**
   * Transforms ASCII digits in a string or number into Persian digits (۰-۹).
   */
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return toPersianDigits(value);
  }
}
