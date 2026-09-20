import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { PersianDateService } from './persian-date.service';

describe('PersianDateService', () => {
  let service: PersianDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersianDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format a specific Gregorian date to Persian format correctly (2024-08-25 -> 4 Shahrivar 1403)', () => {
    // 2024-08-25 is 1403/06/04 (یکشنبه)
    const testDate = new Date(2024, 7, 25);
    const formatted = service.formatDate(testDate);
    expect(formatted).toBe('یکشنبه، ۴ شهریور ۱۴۰۳');
  });

  it('should format another Gregorian date correctly (2024-08-26 -> 5 Shahrivar 1403)', () => {
    // 2024-08-26 is 1403/06/05 (دوشنبه)
    const testDate = new Date(2024, 7, 26);
    const formatted = service.formatDate(testDate);
    expect(formatted).toBe('دوشنبه، ۵ شهریور ۱۴۰۳');
  });

  it('should return detailed Jalali date components', () => {
    const testDate = new Date(2024, 7, 25);
    const details = service.getJalaliDetails(testDate);

    expect(details.dayName).toBe('یکشنبه');
    expect(details.day).toBe(4);
    expect(details.dayFormatted).toBe('۴');
    expect(details.monthName).toBe('شهریور');
    expect(details.year).toBe(1403);
    expect(details.yearFormatted).toBe('۱۴۰۳');
  });

  it('should return a non-empty string for getTodayFormatted()', () => {
    const todayFormatted = service.getTodayFormatted();
    expect(todayFormatted).toBeTruthy();
    expect(typeof todayFormatted).toBe('string');
    expect(todayFormatted).toMatch(/[۰-۹]+/); // Should contain Persian digits
  });

  it('should return valid details for getTodayJalali()', () => {
    const todayJalali = service.getTodayJalali();
    expect(todayJalali.dayName).toBeTruthy();
    expect(todayJalali.monthName).toBeTruthy();
    expect(todayJalali.year).toBeGreaterThan(1400);
  });

  describe('getRelativeTime', () => {
    const now = new Date('2025-01-15T12:00:00Z');

    it('should return "همین الان" for future timestamps', () => {
      const future = new Date('2025-01-15T12:05:00Z');
      expect(service.getRelativeTime(future, now)).toBe('همین الان');
    });

    it('should return "همین الان" for less than 1 minute', () => {
      const recent = new Date('2025-01-15T11:59:30Z'); // 30s ago
      expect(service.getRelativeTime(recent, now)).toBe('همین الان');
    });

    it('should return "۱ دقیقه پیش" for 1 minute', () => {
      const oneMinuteAgo = new Date('2025-01-15T11:59:00Z');
      expect(service.getRelativeTime(oneMinuteAgo, now)).toBe('۱ دقیقه پیش');
    });

    it('should return "۵۹ دقیقه پیش" for 59 minutes', () => {
      const fiftyNineMinsAgo = new Date('2025-01-15T11:01:00Z');
      expect(service.getRelativeTime(fiftyNineMinsAgo, now)).toBe('۵۹ دقیقه پیش');
    });

    it('should return "۱ ساعت پیش" for 1 hour', () => {
      const oneHourAgo = new Date('2025-01-15T11:00:00Z');
      expect(service.getRelativeTime(oneHourAgo, now)).toBe('۱ ساعت پیش');
    });

    it('should return "۲۳ ساعت پیش" for 23 hours', () => {
      const twentyThreeHoursAgo = new Date('2025-01-14T13:00:00Z');
      expect(service.getRelativeTime(twentyThreeHoursAgo, now)).toBe('۲۳ ساعت پیش');
    });

    it('should return "۱ روز پیش" for 24 hours (1 day)', () => {
      const oneDayAgo = new Date('2025-01-14T12:00:00Z');
      expect(service.getRelativeTime(oneDayAgo, now)).toBe('۱ روز پیش');
    });

    it('should return "۶ روز پیش" for 6 days', () => {
      const sixDaysAgo = new Date('2025-01-09T12:00:00Z');
      expect(service.getRelativeTime(sixDaysAgo, now)).toBe('۶ روز پیش');
    });

    it('should return "۱ هفته پیش" for 7 days', () => {
      const sevenDaysAgo = new Date('2025-01-08T12:00:00Z');
      expect(service.getRelativeTime(sevenDaysAgo, now)).toBe('۱ هفته پیش');
    });

    it('should return "۲ هفته پیش" for 14 days', () => {
      const fourteenDaysAgo = new Date('2025-01-01T12:00:00Z');
      expect(service.getRelativeTime(fourteenDaysAgo, now)).toBe('۲ هفته پیش');
    });

    it('should return "۱ ماه پیش" for 30 days', () => {
      const thirtyDaysAgo = new Date('2024-12-16T12:00:00Z');
      expect(service.getRelativeTime(thirtyDaysAgo, now)).toBe('۱ ماه پیش');
    });

    it('should return "۲ ماه پیش" for 60 days', () => {
      const sixtyDaysAgo = new Date('2024-11-16T12:00:00Z');
      expect(service.getRelativeTime(sixtyDaysAgo, now)).toBe('۲ ماه پیش');
    });

    it('should return "۱ سال پیش" for 365 days', () => {
      const oneYearAgo = new Date('2024-01-16T12:00:00Z');
      expect(service.getRelativeTime(oneYearAgo, now)).toBe('۱ سال پیش');
    });

    it('should return "۲ سال پیش" for 730 days', () => {
      const twoYearsAgo = new Date('2023-01-16T12:00:00Z');
      expect(service.getRelativeTime(twoYearsAgo, now)).toBe('۲ سال پیش');
    });

    it('should accept ISO timestamp strings as input', () => {
      const isoString = '2025-01-15T11:45:00Z'; // 15 mins ago
      expect(service.getRelativeTime(isoString, now)).toBe('۱۵ دقیقه پیش');
    });

    it('should calculate "2026-08-25T20:21:44.3713409Z" correctly', () => {
      const refNow = new Date('2026-09-20T20:21:44Z'); // 26 days later (3 weeks)
      const isoWithZ = '2026-08-25T20:21:44.3713409Z';
      expect(service.getRelativeTime(isoWithZ, refNow)).toBe('۳ هفته پیش');
    });

    it('should calculate "2026-08-25T20:21:44.3713409+00:00" correctly', () => {
      const refNow = new Date('2026-09-20T20:21:44Z'); // 26 days later (3 weeks)
      const isoWithOffset = '2026-08-25T20:21:44.3713409+00:00';
      expect(service.getRelativeTime(isoWithOffset, refNow)).toBe('۳ هفته پیش');
    });

    it('should calculate timestamp without timezone suffix "2026-08-25T20:21:44.3713409" as UTC', () => {
      const refNow = new Date('2026-09-20T20:21:44Z'); // 26 days later (3 weeks)
      const rawIso = '2026-08-25T20:21:44.3713409';
      expect(service.getRelativeTime(rawIso, refNow)).toBe('۳ هفته پیش');
    });

    it('should NOT return false "همین الان" for old activity', () => {
      const refNow = new Date('2026-09-20T20:21:44Z');
      const rawIso = '2026-08-25T20:21:44.3713409';
      expect(service.getRelativeTime(rawIso, refNow)).not.toBe('همین الان');
    });

    it('should return "تاریخ نامعتبر" for invalid date strings', () => {
      expect(service.getRelativeTime('invalid-date', now)).toBe('تاریخ نامعتبر');
      expect(service.getRelativeTime('', now)).toBe('تاریخ نامعتبر');
      expect(service.getRelativeTime(null as any, now)).toBe('تاریخ نامعتبر');
    });
  });
});
