import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { PersianDateService } from '../../core/services/persian-date.service';
import { JalaliPipe } from './jalali.pipe';

describe('JalaliPipe (ASCII & Persian Digits)', () => {
  const service = new PersianDateService();

  function createPipe(): JalaliPipe {
    const customInjector = Injector.create({
      providers: [
        { provide: PersianDateService, useValue: service },
      ],
    });

    let pipe!: JalaliPipe;
    runInInjectionContext(customInjector, () => {
      pipe = new JalaliPipe();
    });
    return pipe;
  }

  it('should transform Gregorian date to Jalali with Persian digits by default', () => {
    // 1988-02-05 -> 16-11-1366 -> ۱۶-۱۱-۱۳۶۶
    const result = service.toJalaliString('1988-02-05', true);
    expect(result).toBe('۱۶-۱۱-۱۳۶۶');
  });

  it('should transform Gregorian date to Jalali with ASCII digits when requested', () => {
    // 1988-02-05 -> 16-11-1366
    const result = service.toJalaliString('1988-02-05', false);
    expect(result).toBe('16-11-1366');
  });

  it('should format via JalaliPipe with ascii argument', () => {
    const pipe = createPipe();
    expect(pipe.transform('1988-02-05', 'ascii')).toBe('16-11-1366');
    expect(pipe.transform('1988-02-05', 'persian')).toBe('۱۶-۱۱-۱۳۶۶');
  });
});
