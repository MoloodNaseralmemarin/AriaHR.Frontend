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
});
