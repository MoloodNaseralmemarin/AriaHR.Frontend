import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { PersianDateService } from './persian-date.service';

describe('PersianDateService (Isolated Unit Tests)', () => {
  it('should format gregorian date to jalali string in DD-MM-YYYY format with zero padding', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let service!: PersianDateService;
    runInInjectionContext(injector, () => {
      service = injector.get(PersianDateService);
    });

    // ISO timestamp 2026-10-17T10:25:40.091Z -> 25-07-1405
    expect(service.toJalaliString('2026-10-17T10:25:40.091Z', 'ascii')).toBe('25-07-1405');
    expect(service.toJalaliString('2026-10-17T10:25:40.091Z', 'persian')).toBe('۲۵-۰۷-۱۴۰۵');

    // Single-digit month/day zero padding (2026-05-05 -> 15-02-1405)
    expect(service.toJalaliString('2026-05-05', 'ascii')).toBe('15-02-1405');

    // Explicit YYYY-MM-DD
    expect(service.toJalaliString('2026-05-05', 'ascii', 'YYYY-MM-DD')).toBe('1405-02-15');

    // Graceful invalid/null handling
    expect(service.toJalaliString(null)).toBe('');
    expect(service.toJalaliString(undefined)).toBe('');
    expect(service.toJalaliString('not-a-date')).toBe('');
  });
});
