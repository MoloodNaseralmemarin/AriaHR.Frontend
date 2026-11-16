import { AbstractControl, ValidationErrors } from '@angular/forms';

import {
  WORK_LOCATION_MAX_LATITUDE,
  WORK_LOCATION_MAX_LONGITUDE,
  WORK_LOCATION_MAX_RADIUS_METERS,
  WORK_LOCATION_MIN_LATITUDE,
  WORK_LOCATION_MIN_LONGITUDE,
  WORK_LOCATION_MIN_RADIUS_METERS,
} from './work-location.constants';

/**
 * Rejects values made only of whitespace. Angular's `required` validator treats
 * `"   "` as present, while the API rejects a blank work-location name.
 */
export function nonWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || !value.trim()) {
    return { whitespace: true };
  }
  return null;
}

/** Persian validation message for the work-location name control. */
export function workLocationNameMessage(control: AbstractControl): string | null {
  if (control.hasError('required') || control.hasError('whitespace')) {
    return 'نام محل کار الزامی است.';
  }
  if (control.hasError('maxlength')) {
    return 'نام محل کار نمی‌تواند بیش از ۲۰۰ کاراکتر باشد.';
  }
  return null;
}

/** Persian validation message for the allowed-radius control. */
export function workLocationRadiusMessage(control: AbstractControl): string | null {
  if (control.hasError('required')) {
    return 'وارد کردن شعاع محدودهٔ مجاز الزامی است.';
  }
  if (control.hasError('min')) {
    return `شعاع محدوده باید حداقل ${WORK_LOCATION_MIN_RADIUS_METERS.toLocaleString(
      'fa-IR'
    )} متر باشد.`;
  }
  if (control.hasError('max')) {
    return `شعاع محدوده نمی‌تواند بیشتر از ${WORK_LOCATION_MAX_RADIUS_METERS.toLocaleString(
      'fa-IR'
    )} متر باشد.`;
  }
  return null;
}

/** Validates a selected WGS-84 point before sending it to the API. */
export function coordinateMessage(lat: number, lng: number): string | null {
  if (
    !Number.isFinite(lat) ||
    lat < WORK_LOCATION_MIN_LATITUDE ||
    lat > WORK_LOCATION_MAX_LATITUDE
  ) {
    return 'عرض جغرافیایی انتخاب‌شده معتبر نیست. لطفاً نقطهٔ دیگری روی نقشه انتخاب کنید.';
  }
  if (
    !Number.isFinite(lng) ||
    lng < WORK_LOCATION_MIN_LONGITUDE ||
    lng > WORK_LOCATION_MAX_LONGITUDE
  ) {
    return 'طول جغرافیایی انتخاب‌شده معتبر نیست. لطفاً نقطهٔ دیگری روی نقشه انتخاب کنید.';
  }
  return null;
}
