import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliPipe } from './jalali.pipe';
import { PersianDateService } from '../../core/services/persian-date.service';

describe('JalaliPipe', () => {
  const injector = createEnvironmentInjector([
    { provide: PersianDateService, useClass: PersianDateService },
  ], {} as EnvironmentInjector);

  let pipe!: JalaliPipe;
  runInInjectionContext(injector, () => {
    pipe = new JalaliPipe();
  });

  it('should transform Gregorian date string to Jalali format in ASCII digits DD-MM-YYYY', () => {
    expect(pipe.transform('2026-05-05')).toBe('15-02-1405');
    expect(pipe.transform('2026-03-21')).toBe('01-01-1405');
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
