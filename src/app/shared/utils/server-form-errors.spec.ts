import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';

import { applyServerFieldErrors, clearServerFieldErrors } from './server-form-errors';

describe('server form errors', () => {
  it('maps ProblemDetails field keys onto form controls', () => {
    const form = new FormGroup({
      startTime: new FormControl(''),
      endTime: new FormControl(''),
    });

    const unmatched = applyServerFieldErrors(form, {
      StartTime: 'ساعت شروع الزامی است.',
      EndTime: 'ساعت پایان باید بعد از ساعت شروع باشد.',
    });

    expect(unmatched).toEqual([]);
    expect(form.controls.startTime.errors?.['serverError']).toBe('ساعت شروع الزامی است.');
    expect(form.controls.endTime.errors?.['serverError']).toBe(
      'ساعت پایان باید بعد از ساعت شروع باشد.'
    );
    expect(form.controls.startTime.touched).toBe(true);
  });

  it('returns field errors that have no matching control', () => {
    const form = new FormGroup({ name: new FormControl('') });

    const unmatched = applyServerFieldErrors(form, { UnknownField: 'پیام نامشخص' });

    expect(unmatched).toEqual(['پیام نامشخص']);
    expect(form.controls.name.errors).toBeNull();
  });

  it('clears server errors while keeping client-side validation errors', () => {
    const form = new FormGroup({ name: new FormControl('') });
    form.controls.name.setErrors({ required: true, serverError: 'پیام سرور' });

    clearServerFieldErrors(form);

    expect(form.controls.name.errors).toEqual({ required: true });
  });
});
