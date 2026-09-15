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
});
