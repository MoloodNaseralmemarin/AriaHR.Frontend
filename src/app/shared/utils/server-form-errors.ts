import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * Attaches ASP.NET Core ProblemDetails `errors` entries to the matching form
 * controls as a `serverError` validation error, so the field-level Persian
 * message returned by the backend is shown next to the control.
 *
 * Matching is tolerant: the backend may use PascalCase (`StartTime`), camelCase
 * (`startTime`) or any casing of the same name.
 *
 * @returns messages that could not be matched to a control, so the caller can
 *          present them as a general error instead of dropping them.
 */
export function applyServerFieldErrors(
  form: FormGroup,
  fieldErrors: Record<string, string> | null | undefined
): string[] {
  const unmatched: string[] = [];

  if (!fieldErrors) {
    return unmatched;
  }

  for (const [field, message] of Object.entries(fieldErrors)) {
    if (!message) {
      continue;
    }

    const control = findControl(form, field);
    if (!control) {
      unmatched.push(message);
      continue;
    }

    control.setErrors({ ...(control.errors ?? {}), serverError: message });
    control.markAsTouched();
  }

  return unmatched;
}

/** Removes `serverError` errors that a previous backend response left behind. */
export function clearServerFieldErrors(form: FormGroup): void {
  for (const control of Object.values(form.controls)) {
    const errors = control.errors;
    if (!errors || !('serverError' in errors)) {
      continue;
    }

    const { serverError: _serverError, ...rest } = errors;
    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }
}

function findControl(form: FormGroup, field: string): AbstractControl | null {
  const controls = form.controls;

  if (!field) {
    return null;
  }

  const candidates = [field, field.charAt(0).toLowerCase() + field.slice(1)];

  for (const candidate of candidates) {
    if (controls[candidate]) {
      return controls[candidate];
    }
  }

  const lowerField = field.toLowerCase();
  const matchingKey = Object.keys(controls).find((key) => key.toLowerCase() === lowerField);
  return matchingKey ? controls[matchingKey] : null;
}
