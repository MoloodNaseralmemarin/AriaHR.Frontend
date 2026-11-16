import { describe, it, expect } from 'vitest';

import {
  completeTimeDigits,
  extractTimeDigits,
  formatTimeDigits,
  isValidTime24h,
  normalizeTimeValue,
} from './time-input.util';

describe('time-input.util', () => {
  it('extracts digits from typed, Persian and pasted values', () => {
    expect(extractTimeDigits('1622')).toBe('1622');
    expect(extractTimeDigits('16:22')).toBe('1622');
    expect(extractTimeDigits('۱۶۲۲')).toBe('1622');
    expect(extractTimeDigits(' 16:22 ')).toBe('1622');
    expect(extractTimeDigits('123456')).toBe('1234');
    expect(extractTimeDigits('')).toBe('');
  });

  it('inserts the colon automatically while typing', () => {
    expect(formatTimeDigits('1')).toBe('1');
    expect(formatTimeDigits('16')).toBe('16');
    expect(formatTimeDigits('162')).toBe('16:2');
    expect(formatTimeDigits('1622')).toBe('16:22');
  });

  describe('completeTimeDigits', () => {
    it('completes the documented input examples', () => {
      expect(completeTimeDigits('1622')).toBe('16:22');
      expect(completeTimeDigits('0930')).toBe('09:30');
      expect(completeTimeDigits('0800')).toBe('08:00');
      expect(completeTimeDigits('2359')).toBe('23:59');
      expect(completeTimeDigits('7')).toBe('07:00');
      expect(completeTimeDigits('730')).toBe('07:30');
    });

    it('completes two-digit hours and keeps invalid values for validation', () => {
      expect(completeTimeDigits('16')).toBe('16:00');
      expect(completeTimeDigits('2565')).toBe('25:65');
      expect(completeTimeDigits('')).toBe('');
    });
  });

  describe('isValidTime24h', () => {
    it('accepts hours 00-23 and minutes 00-59', () => {
      expect(isValidTime24h('00:00')).toBe(true);
      expect(isValidTime24h('23:59')).toBe(true);
      expect(isValidTime24h('09:30')).toBe(true);
      expect(isValidTime24h('7:30')).toBe(true);
      expect(isValidTime24h('۱۴:۰۵')).toBe(true);
    });

    it('rejects out-of-range and malformed values', () => {
      expect(isValidTime24h('2565')).toBe(false);
      expect(isValidTime24h('25:65')).toBe(false);
      expect(isValidTime24h('2460')).toBe(false);
      expect(isValidTime24h('24:60')).toBe(false);
      expect(isValidTime24h('1269')).toBe(false);
      expect(isValidTime24h('12:69')).toBe(false);
      expect(isValidTime24h('')).toBe(false);
      expect(isValidTime24h(null)).toBe(false);
    });
  });

  it('normalizes complete values for the backend payload', () => {
    expect(normalizeTimeValue('1622')).toBe('16:22');
    expect(normalizeTimeValue('730')).toBe('07:30');
    expect(normalizeTimeValue('16:22:00')).toBe('16:22');
    expect(normalizeTimeValue('2565')).toBeNull();
    expect(normalizeTimeValue('2460')).toBeNull();
    expect(normalizeTimeValue('1269')).toBeNull();
    expect(normalizeTimeValue('')).toBeNull();
  });
});
