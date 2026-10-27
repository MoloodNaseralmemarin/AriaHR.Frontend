import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeRange } from './time.util';

describe('time.util', () => {
  describe('formatTime', () => {
    it('should format HH:mm:ss to HH:mm', () => {
      expect(formatTime('08:30:00')).toBe('08:30');
      expect(formatTime('16:45:59')).toBe('16:45');
    });

    it('should format HH:mm to HH:mm', () => {
      expect(formatTime('08:30')).toBe('08:30');
      expect(formatTime('14:05')).toBe('14:05');
    });

    it('should pad single-digit hours and minutes', () => {
      expect(formatTime('8:5')).toBe('08:05');
      expect(formatTime('9:0')).toBe('09:00');
    });

    it('should handle Persian digits', () => {
      expect(formatTime('۰۸:۳۰:۰۰')).toBe('08:30');
      expect(formatTime('۱۴:۰۵')).toBe('14:05');
    });

    it('should return null for null, undefined, empty, or whitespace strings', () => {
      expect(formatTime(null)).toBeNull();
      expect(formatTime(undefined)).toBeNull();
      expect(formatTime('')).toBeNull();
      expect(formatTime('   ')).toBeNull();
    });

    it('should return null for invalid time formats or values out of range', () => {
      expect(formatTime('invalid')).toBeNull();
      expect(formatTime('25:00')).toBeNull();
      expect(formatTime('12:60')).toBeNull();
    });
  });

  describe('formatTimeRange', () => {
    it('should format valid start and end times in HH:mm - HH:mm format without seconds', () => {
      expect(formatTimeRange('08:30:00', '10:00:00')).toBe('08:30 - 10:00');
      expect(formatTimeRange('08:30', '10:00')).toBe('08:30 - 10:00');
    });

    it('should handle Persian digits in time range input', () => {
      expect(formatTimeRange('۰۸:۳۰:۰۰', '۱۰:۰۰:۰۰')).toBe('08:30 - 10:00');
    });

    it('should return default fallback when start or end time is missing or invalid', () => {
      expect(formatTimeRange(null, '10:00')).toBe('تعیین نشده');
      expect(formatTimeRange('08:30', undefined)).toBe('تعیین نشده');
      expect(formatTimeRange('invalid', '10:00')).toBe('تعیین نشده');
      expect(formatTimeRange(null, null)).toBe('تعیین نشده');
    });

    it('should return custom fallback when provided', () => {
      expect(formatTimeRange(null, null, '—')).toBe('—');
    });
  });
});
