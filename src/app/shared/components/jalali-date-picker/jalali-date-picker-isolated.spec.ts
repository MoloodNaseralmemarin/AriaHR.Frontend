import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliDatePickerComponent } from './jalali-date-picker.component';
import { PersianDateService } from '../../../core/services/persian-date.service';

describe('JalaliDatePickerComponent (Isolated Unit Tests)', () => {
  it('should format initial Gregorian writeValue according to digitsFormat and dateFormat and update segment signals', () => {
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
    expect(picker.dayInput()).toBe('۱۵');
    expect(picker.monthSelect()).toBe('2');
    expect(picker.yearInput()).toBe('۱۴۰۵');

    // Custom: ASCII digits, YYYY-MM-DD
    picker.digitsFormat = 'ascii';
    picker.dateFormat = 'YYYY-MM-DD';
    picker.writeValue('2026-05-05');
    expect(picker.displayValue()).toBe('1405-02-15');
    expect(picker.dayInput()).toBe('15');
    expect(picker.monthSelect()).toBe('2');
    expect(picker.yearInput()).toBe('1405');
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

  it('should update model value when user fills segmented Day, Month, and Year inputs', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    let lastOutput: string | null = null;
    picker.registerOnChange((val) => {
      lastOutput = val;
    });

    picker.onSegmentInput('day', { target: { value: '15' } } as unknown as Event);
    picker.onSegmentSelect('month', { target: { value: '2' } } as unknown as Event);
    picker.onSegmentInput('year', { target: { value: '1405' } } as unknown as Event);

    expect(picker.displayValue()).toBe('۱۵-۰۲-۱۴۰۵');
    expect(lastOutput).toBe('2026-05-05');
  });

  it('should validate invalid or incomplete date inputs', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    // Incomplete date
    picker.onSegmentInput('day', { target: { value: '31' } } as unknown as Event);
    picker.onSegmentSelect('month', { target: { value: '12' } } as unknown as Event);
    picker.onSegmentInput('year', { target: { value: '1401' } } as unknown as Event); // 1401 is non-leap year (Esfand has max 29 days)

    expect(picker.validate({ value: null } as any)).toEqual({ invalidJalaliDate: true });
  });
});
