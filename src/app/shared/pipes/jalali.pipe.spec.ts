import { describe, it, expect } from 'vitest';
import { JalaliPipe } from './jalali.pipe';
import { PersianDateService } from '../../core/services/persian-date.service';

describe('JalaliPipe', () => {
  const service = new PersianDateService();
  const pipe = new JalaliPipe();
  // @ts-ignore
  pipe['persianDateService'] = service;

  it('should transform Gregorian date string to Jalali format in Persian digits', () => {
    expect(pipe.transform('2026-05-05')).toBe('۱۵-۰۲-۱۴۰۵');
    expect(pipe.transform('2026-03-21')).toBe('۰۱-۰۱-۱۴۰۵');
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
