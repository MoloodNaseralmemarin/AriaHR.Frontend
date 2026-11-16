import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';

import { getStatusFallbackMessage, parseApiError } from './api-error.util';

describe('parseApiError', () => {
  it('uses ProblemDetails detail for a 400 business error', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'خطای کسب و کار',
        status: 400,
        detail: 'شرح دقیق خطای رخ داده در سیستم',
      },
    });

    const info = parseApiError(error);

    expect(info.status).toBe(400);
    expect(info.title).toBe('خطای کسب و کار');
    expect(info.detail).toBe('شرح دقیق خطای رخ داده در سیستم');
    expect(info.message).toBe('شرح دقیق خطای رخ داده در سیستم');
  });

  it('falls back to title when detail is missing', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { title: 'نام مرکز تکراری است.', status: 400 },
    });

    expect(parseApiError(error).message).toBe('نام مرکز تکراری است.');
  });

  it('extracts ASP.NET Core validation errors and normalizes parameter casing', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          StartTime: ['ساعت شروع الزامی است.'],
          Reason: ['دلیل درخواست بیش از حد طولانی است.'],
        },
      },
    });

    const info = parseApiError(error);

    expect(info.fieldErrors).toEqual({
      StartTime: 'ساعت شروع الزامی است.',
      Reason: 'دلیل درخواست بیش از حد طولانی است.',
    });
    expect(info.message).toBe('ساعت شروع الزامی است.؛ دلیل درخواست بیش از حد طولانی است.');
  });

  it('supports legacy { message } envelopes and plain string bodies', () => {
    expect(
      parseApiError({ status: 409, error: { message: 'این محل کار قبلاً ثبت شده است.' } }).message
    ).toBe('این محل کار قبلاً ثبت شده است.');

    expect(parseApiError({ status: 400, error: 'اطلاعات ارسالی معتبر نیست.' }).message).toBe(
      'اطلاعات ارسالی معتبر نیست.'
    );
  });

  it('never surfaces raw JSON, HTML or technical messages', () => {
    const jsonError = new HttpErrorResponse({ status: 500, error: '{"title":"boom"}' });
    expect(parseApiError(jsonError).message).toBe(getStatusFallbackMessage(500));

    const htmlError = new HttpErrorResponse({
      status: 502,
      error: '<html><body>Bad Gateway</body></html>',
    });
    expect(parseApiError(htmlError).message).toBe(getStatusFallbackMessage(502));

    const technicalError = new HttpErrorResponse({
      status: 500,
      error: { title: 'Internal Server Error', detail: 'System.Exception at Foo.Bar()' },
    });
    expect(parseApiError(technicalError).message).toBe(getStatusFallbackMessage(500));

    expect(parseApiError(new Error('Server error occurred')).message).toBe(
      getStatusFallbackMessage(-1)
    );
  });

  it('uses Persian network/HTTP fallbacks when the backend sends no message', () => {
    expect(parseApiError(new HttpErrorResponse({ status: 0 })).message).toContain(
      'ارتباط با سرور برقرار نشد'
    );
    expect(parseApiError(new HttpErrorResponse({ status: 401 })).message).toContain('نشست شما');
    expect(parseApiError(new HttpErrorResponse({ status: 403 })).message).toContain('دسترسی');
    expect(parseApiError(new HttpErrorResponse({ status: 404 })).message).toContain('یافت نشد');
    expect(parseApiError(new HttpErrorResponse({ status: 409 })).message).toContain('مغایرت');
    expect(parseApiError(new HttpErrorResponse({ status: 500 })).message).toContain('خطایی در سرور');
    expect(parseApiError(new HttpErrorResponse({ status: 503 })).message).toContain('در دسترس نیست');
  });

  it('prefers a Persian backend detail over the status fallback on network failures', () => {
    const error = new HttpErrorResponse({
      status: 0,
      error: { detail: 'اتصال به سرویس حضور و غیاب برقرار نشد.' },
    });

    expect(parseApiError(error).message).toBe('اتصال به سرویس حضور و غیاب برقرار نشد.');
  });
});
