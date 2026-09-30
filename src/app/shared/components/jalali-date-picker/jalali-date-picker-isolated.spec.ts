import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliDatePickerComponent } from './jalali-date-picker.component';
import { PersianDateService } from '../../../core/services/persian-date.service';

describe('JalaliDatePickerComponent (Isolated Unit Tests)', () => {
  it('should format initial Gregorian writeValue according to digitsFormat and dateFormat', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    // Default: Persian digits, DD-MM-YYYY
    picker.writeValue('2026-05-05');
    expect(picker.displayValue()).toBe('۱۵-۰۲-۱۴۰۵');

    // Custom: ASCII digits, YYYY-MM-DD
    picker.digitsFormat = 'ascii';
    picker.dateFormat = 'YYYY-MM-DD';
    picker.writeValue('2026-05-05');
    expect(picker.displayValue()).toBe('1405-02-15');
  });

  it('should format continuous user input in YYYY-MM-DD format with ASCII digits', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    picker.digitsFormat = 'ascii';
    picker.dateFormat = 'YYYY-MM-DD';

    let lastOutput: string | null = null;
    picker.registerOnChange((val) => {
      lastOutput = val;
    });

    const mockEvent = {
      target: { value: '14050215' }
    } as unknown as Event;

    picker.onInputChange(mockEvent);

    expect(picker.displayValue()).toBe('1405-02-15');
    expect(lastOutput).toBe('2026-05-05');
  });
});
