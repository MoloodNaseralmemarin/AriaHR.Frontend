import { describe, it, expect } from 'vitest';
import { PersianDigitsPipe } from './persian-digits.pipe';

describe('PersianDigitsPipe', () => {
  const pipe = new PersianDigitsPipe();

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform ASCII numbers to Persian digits', () => {
    expect(pipe.transform('12345')).toBe('۱۲۳۴۵');
    expect(pipe.transform('09121234567')).toBe('۰۹۱۲۱۲۳۴۵۶۷');
    expect(pipe.transform('1234567890')).toBe('۱۲۳۴۵۶۷۸۹۰');
  });

  it('should transform numbers', () => {
    expect(pipe.transform(12345)).toBe('۱۲۳۴۵');
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
