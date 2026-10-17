import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliPipe } from './jalali.pipe';
import { PersianDateService } from '../../core/services/persian-date.service';

describe('JalaliPipe (Isolated Unit Tests)', () => {
  it('should transform Gregorian dates into Jalali strings in DD-MM-YYYY format by default', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let pipe!: JalaliPipe;
    runInInjectionContext(injector, () => {
      pipe = new JalaliPipe();
    });

    expect(pipe.transform('2026-10-17T10:25:40.091Z', 'ascii')).toBe('25-07-1405');
    expect(pipe.transform('2026-10-17T10:25:40.091Z')).toBe('۲۵-۰۷-۱۴۰۵');

    expect(pipe.transform('2026-05-05')).toBe('۱۵-۰۲-۱۴۰۵');
    expect(pipe.transform('2026-05-05', 'ascii')).toBe('15-02-1405');
    expect(pipe.transform('2026-05-05', 'ascii', 'YYYY-MM-DD')).toBe('1405-02-15');
    expect(pipe.transform('2026-05-05', 'persian', 'YYYY-MM-DD')).toBe('۱۴۰۵-۰۲-۱۵');

    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('invalid-date')).toBe('');
  });
});
