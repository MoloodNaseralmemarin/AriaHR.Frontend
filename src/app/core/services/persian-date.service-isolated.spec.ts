import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { PersianDateService } from './persian-date.service';

describe('PersianDateService (Isolated Unit Tests)', () => {
  it('should format gregorian date to jalali string with persian or ascii digits and custom format', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let service!: PersianDateService;
    runInInjectionContext(injector, () => {
      service = injector.get(PersianDateService);
    });

    // Default: ASCII digits, YYYY-MM-DD
    expect(service.toJalaliString('2026-05-05')).toBe('1405-02-15');

    // Persian digits, YYYY-MM-DD
    expect(service.toJalaliString('2026-05-05', 'persian')).toBe('۱۴۰۵-۰۲-۱۵');

    // ASCII digits, DD-MM-YYYY
    expect(service.toJalaliString('2026-05-05', 'ascii', 'DD-MM-YYYY')).toBe('15-02-1405');

    // Persian digits, DD-MM-YYYY
    expect(service.toJalaliString('2026-05-05', 'persian', 'DD-MM-YYYY')).toBe('۱۵-۰۲-۱۴۰۵');
  });

  it('should format date range in exact DD-MM-YYYY تا DD-MM-YYYY format using ASCII digits', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let service!: PersianDateService;
    runInInjectionContext(injector, () => {
      service = injector.get(PersianDateService);
    });

    // 2026-11-01 -> 10-08-1405, 2026-10-26 -> 04-08-1405
    const result = service.formatDateRange('2026-11-01', '2026-10-26');
    expect(result).toBe('10-08-1405 تا 04-08-1405');

    // Single digit day/month leading zeros test: 2026-03-21 -> 01-01-1405
    const singleDigitResult = service.formatDateRange('2026-03-21', '2026-05-05');
    expect(singleDigitResult).toBe('01-01-1405 تا 15-02-1405');

    // Partial/null date range handling
    expect(service.formatDateRange('2026-05-05', null)).toBe('15-02-1405');
    expect(service.formatDateRange(null, null)).toBe('تعیین نشده');
  });
});
