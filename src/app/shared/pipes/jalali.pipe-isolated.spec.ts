import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliPipe } from './jalali.pipe';
import { PersianDateService } from '../../core/services/persian-date.service';

describe('JalaliPipe (Isolated Unit Tests)', () => {
  it('should transform Gregorian dates into Jalali strings using pipe parameters', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let pipe!: JalaliPipe;
    runInInjectionContext(injector, () => {
      pipe = new JalaliPipe();
    });

    expect(pipe.transform('2026-05-05')).toBe('1405-02-15');
    expect(pipe.transform('2026-05-05', 'persian')).toBe('۱۴۰۵-۰۲-۱۵');
    expect(pipe.transform('2026-05-05', 'ascii', 'DD-MM-YYYY')).toBe('15-02-1405');
    expect(pipe.transform('2026-05-05', 'persian', 'DD-MM-YYYY')).toBe('۱۵-۰۲-۱۴۰۵');
  });
});
