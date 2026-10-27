import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { JalaliDatePickerComponent } from './jalali-date-picker.component';
import { PersianDateService } from '../../../core/services/persian-date.service';

describe('JalaliDatePickerComponent', () => {
  function createComponent(): JalaliDatePickerComponent {
    const injector = createEnvironmentInjector([
      { provide: PersianDateService, useClass: PersianDateService },
    ], {} as EnvironmentInjector);

    let component!: JalaliDatePickerComponent;
    runInInjectionContext(injector, () => {
      component = new JalaliDatePickerComponent();
    });
    return component;
  }

  it('should write value in Gregorian and set display value in Jalali ASCII digits', () => {
    const comp = createComponent();
    comp.writeValue('2026-05-05');
    expect(comp.displayValue()).toBe('1405-02-15');
  });

  it('should write null/empty value and clear display value', () => {
    const comp = createComponent();
    comp.writeValue(null);
    expect(comp.displayValue()).toBe('');
  });

  it('should handle user input in Persian or English digits and notify onChange with Gregorian value', () => {
    const comp = createComponent();
    const onChangeSpy = vi.fn();
    comp.registerOnChange(onChangeSpy);

    const event = {
      target: { value: '1405-02-15' },
    } as unknown as Event;

    comp.onInputChange(event);

    expect(comp.displayValue()).toBe('1405-02-15');
    expect(onChangeSpy).toHaveBeenCalledWith('2026-05-05');
  });

  it('should handle continuous digit typing (e.g. "14050215") and format it as YYYY-MM-DD in ASCII digits', () => {
    const comp = createComponent();
    const onChangeSpy = vi.fn();
    comp.registerOnChange(onChangeSpy);

    const event = {
      target: { value: '14050215' },
    } as unknown as Event;

    comp.onInputChange(event);

    expect(comp.displayValue()).toBe('1405-02-15');
    expect(onChangeSpy).toHaveBeenCalledWith('2026-05-05');
  });

  it('should return error validation object if Jalali date is invalid', () => {
    const comp = createComponent();
    const event = {
      target: { value: '31-07-1403' }, // Invalid because Month 7 has max 30 days
    } as unknown as Event;

    comp.onInputChange(event);

    const mockControl = { value: '31-07-1403' } as any;
    expect(comp.validate(mockControl)).toEqual({ invalidJalaliDate: true });
  });
});
