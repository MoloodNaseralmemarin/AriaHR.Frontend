import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliDatePickerComponent } from './jalali-date-picker.component';
import { PersianDateService } from '../../../core/services/persian-date.service';

describe('JalaliDatePickerComponent (Isolated Unit Tests)', () => {
  it('should format initial Gregorian writeValue to YYYY/MM/DD and update segment signals', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    picker.writeValue('2026-05-05');
    expect(picker.displayValue()).toBe('۱۴۰۵/۰۲/۱۵');
    expect(picker.yearInput()).toBe('۱۴۰۵');
    expect(picker.monthSelect()).toBe('2');
    expect(picker.dayInput()).toBe('۱۵');
  });

  it('should format continuous user input YYYYMMDD with ASCII digits and slash separators', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    picker.digitsFormat = 'ascii';

    let lastOutput: string | null = null;
    picker.registerOnChange((val) => {
      lastOutput = val;
    });

    const mockEvent = {
      target: { value: '14050215' }
    } as unknown as Event;

    picker.onInputChange(mockEvent);

    expect(picker.displayValue()).toBe('1405/02/15');
    expect(lastOutput).toBe('2026-05-05');
  });

  it('should update model value when user fills segmented Year, Month, and Day inputs', () => {
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

    picker.onSegmentInput('year', { target: { value: '1370' } } as unknown as Event);
    picker.onSegmentSelect('month', { target: { value: '12' } } as unknown as Event);
    picker.onSegmentInput('day', { target: { value: '30' } } as unknown as Event);

    expect(picker.displayValue()).toBe('۱۳۷۰/۱۲/۳۰');
    expect(lastOutput).toBe('1992-03-20');
  });

  it('should validate invalid or incomplete date inputs', () => {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let picker!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      picker = new JalaliDatePickerComponent();
    });

    picker.onSegmentInput('year', { target: { value: '1401' } } as unknown as Event); // 1401 is non-leap year (Esfand has max 29 days)
    picker.onSegmentSelect('month', { target: { value: '12' } } as unknown as Event);
    picker.onSegmentInput('day', { target: { value: '30' } } as unknown as Event);

    expect(picker.validate({ value: null } as any)).toEqual({ invalidJalaliDate: true });
  });
});
