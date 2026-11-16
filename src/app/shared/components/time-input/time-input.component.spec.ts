import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TimeInputComponent } from './time-input.component';

describe('TimeInputComponent', () => {
  let fixture: ComponentFixture<TimeInputComponent>;
  let component: TimeInputComponent;
  let input: HTMLInputElement;
  let onChange: ReturnType<typeof vi.fn<(value: string) => void>>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TimeInputComponent] });

    fixture = TestBed.createComponent(TimeInputComponent);
    component = fixture.componentInstance;
    onChange = vi.fn<(value: string) => void>();
    component.registerOnChange((value: string) => onChange(value));
    fixture.detectChanges();

    input = fixture.nativeElement.querySelector('input');
  });

  const type = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const blur = () => {
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  it('formats four typed digits into HH:mm and emits the backend value', () => {
    type('1622');

    expect(component.displayValue()).toBe('۱۶:۲۲');
    expect(onChange).toHaveBeenLastCalledWith('16:22');
  });

  it('keeps the colon while typing the third and fourth digits', () => {
    type('162');
    expect(component.displayValue()).toBe('۱۶:۲');
    expect(onChange).toHaveBeenLastCalledWith('');

    type('16:22');
    expect(component.displayValue()).toBe('۱۶:۲۲');
    expect(onChange).toHaveBeenLastCalledWith('16:22');
  });

  it('completes short values on blur', () => {
    type('7');
    blur();
    expect(component.displayValue()).toBe('۰۷:۰۰');
    expect(onChange).toHaveBeenLastCalledWith('07:00');

    type('730');
    blur();
    expect(component.displayValue()).toBe('۰۷:۳۰');
    expect(onChange).toHaveBeenLastCalledWith('07:30');

    type('0930');
    blur();
    expect(component.displayValue()).toBe('۰۹:۳۰');
    expect(onChange).toHaveBeenLastCalledWith('09:30');
  });

  it('accepts pasted values with or without a colon', () => {
    type('16:22');
    expect(onChange).toHaveBeenLastCalledWith('16:22');

    type('۰۸:۰۰');
    expect(onChange).toHaveBeenLastCalledWith('08:00');
  });

  it('rejects invalid times with a Persian message and an invalid control', () => {
    type('2565');
    blur();

    expect(component.errorVisible()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('ساعت وارد شده معتبر نیست');
    expect(component.validate({ value: '25:65' } as never)).toEqual({ timeInvalid: true });
    expect(component.validate({ value: '23:59' } as never)).toBeNull();
  });

  it('clears the value and does not report an error when emptied', () => {
    type('1622');
    type('');
    blur();

    expect(component.displayValue()).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(component.errorVisible()).toBe(false);
  });

  it('shows persisted backend values without requiring the colon', () => {
    component.writeValue('09:30');
    fixture.detectChanges();

    expect(input.value).toBe('۰۹:۳۰');
    expect(component.errorVisible()).toBe(false);
  });

  it('re-completes the value when Enter is pressed', () => {
    type('800');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(component.displayValue()).toBe('۰۸:۰۰');
    expect(onChange).toHaveBeenLastCalledWith('08:00');
  });
});
