import { describe, it, expect } from 'vitest';

import {
  resolveWorkLocationFieldErrors,
  resolveWorkLocationSubmitError,
} from './work-location-error.util';

function problemErrors(errors: Record<string, string[]>, status = 400): unknown {
  return {
    status,
    error: {
      title: 'One or more validation errors occurred.',
      detail: 'One or more validation errors occurred.',
      errors,
    },
  };
}

describe('work-location error helpers', () => {
  it('should map backend field keys (including $. paths) to Persian messages', () => {
    const result = resolveWorkLocationFieldErrors(
      problemErrors({
        '$.name': ['The Name field is required.'],
        allowedRadiusInMeters: [
          'The field AllowedRadiusInMeters must be between 1 and 1000.',
        ],
      })
    );

    expect(result.name).toBe('نام محل کار الزامی است.');
    expect(result.radiusInMeters).toBe('شعاع محدوده باید بین ۱ تا ۱٬۰۰۰ متر باشد.');
  });

  it('should explain the backend name length rule in Persian', () => {
    const result = resolveWorkLocationFieldErrors(
      problemErrors({
        Name: ['The field Name must be a string or array type with a maximum length of 200.'],
      })
    );

    expect(result.name).toBe('نام محل کار نمی‌تواند بیش از ۲۰۰ کاراکتر باشد.');
  });

  it('should keep errors for fields the form cannot render instead of hiding them', () => {
    const result = resolveWorkLocationFieldErrors(
      problemErrors({ QrRotationIntervalMinutes: ['The field is invalid.'] })
    );

    expect(result.general).toBe('The field is invalid.');
  });

  it('should answer a field-only 400 with a Persian summary', () => {
    const message = resolveWorkLocationSubmitError(
      problemErrors({ Name: ['The Name field is required.'] }),
      'create'
    );

    expect(message).toBe(
      'اطلاعات محل کار معتبر نیست. مقادیر مشخص‌شده را اصلاح و دوباره تلاش کنید.'
    );
  });

  it('should answer a 400 whose English summary is joined with «؛» in Persian', () => {
    const message = resolveWorkLocationSubmitError(
      problemErrors({
        '$.name': ['The Name field is required.'],
        AllowedRadiusInMeters: [
          'The field AllowedRadiusInMeters must be between 1 and 1000.',
        ],
      }),
      'create'
    );

    expect(message).toBe(
      'اطلاعات محل کار معتبر نیست. مقادیر مشخص‌شده را اصلاح و دوباره تلاش کنید.'
    );
  });

  it('should keep a Persian backend message intact', () => {
    const message = resolveWorkLocationSubmitError(
      { status: 400, error: { detail: 'نام محل کار تکراری است.' } },
      'create'
    );

    expect(message).toBe('نام محل کار تکراری است.');
  });

  it('should explain a conflict in Persian', () => {
    const message = resolveWorkLocationSubmitError({ status: 409, error: null }, 'create');

    expect(message).toBe('محل کاری با این نام در این مرکز از قبل ثبت شده است.');
  });
});
