import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { toPersianDigits } from '../../utils/mobile-number.util';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function normalizeDigitsToAscii(input: string): string {
  if (!input) return '';
  let result = '';
  for (const char of input) {
    const pIdx = PERSIAN_DIGITS.indexOf(char);
    const aIdx = ARABIC_DIGITS.indexOf(char);
    if (pIdx !== -1) {
      result += String(pIdx);
    } else if (aIdx !== -1) {
      result += String(aIdx);
    } else {
      result += char;
    }
  }
  return result;
}

export interface ParsedTime {
  englishValue: string;
  displayPersian: string;
  isValid: boolean;
  isEmpty: boolean;
}

export function parseTimeInput(raw: string): ParsedTime {
  if (!raw || !raw.trim()) {
    return { englishValue: '', displayPersian: '', isValid: true, isEmpty: true };
  }

  const normalized = normalizeDigitsToAscii(raw.trim());
  const clean = normalized.replace(/[^0-9:]/g, '');

  if (!clean) {
    return { englishValue: '', displayPersian: '', isValid: true, isEmpty: true };
  }

  let h: number;
  let m: number;
  let isValid = false;
  let englishValue = clean;

  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length === 2 && parts[0] !== '' && parts[1] !== '') {
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      if (parts[0].length <= 2 && parts[1].length <= 2 && !isNaN(h) && !isNaN(m)) {
        englishValue = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          isValid = true;
        }
      }
    }
  } else {
    if (clean.length === 3) {
      h = parseInt(clean.slice(0, 1), 10);
      m = parseInt(clean.slice(1), 10);
      englishValue = `0${h}:${clean.slice(1).padStart(2, '0')}`;
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        isValid = true;
      }
    } else if (clean.length === 4) {
      h = parseInt(clean.slice(0, 2), 10);
      m = parseInt(clean.slice(2), 10);
      englishValue = `${clean.slice(0, 2)}:${clean.slice(2)}`;
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        isValid = true;
      }
    }
  }

  const displayPersian = toPersianDigits(englishValue);
  return {
    englishValue,
    displayPersian,
    isValid,
    isEmpty: false,
  };
}

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-input.component.html',
  styleUrls: ['./time-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true,
    },
  ],
})
export class TimeInputComponent implements ControlValueAccessor, Validator {
  @Input() id = '';
  @Input() placeholder = 'مثال: ۰۸:۳۰';

  readonly disabled = signal<boolean>(false);
  readonly displayValue = signal<string>('');
  readonly currentValue = signal<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(val: unknown): void {
    if (val === null || val === undefined || val === '') {
      this.currentValue.set('');
      this.displayValue.set('');
      return;
    }
    const str = String(val);
    const parsed = parseTimeInput(str);
    this.currentValue.set(parsed.englishValue);
    this.displayValue.set(parsed.displayPersian);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (!val) {
      return null;
    }
    const parsed = parseTimeInput(String(val));
    if (!parsed.isValid) {
      return { invalidTime: true };
    }
    return null;
  }

  onInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const rawVal = inputEl.value;
    const parsed = parseTimeInput(rawVal);

    this.currentValue.set(parsed.englishValue);
    this.onChange(parsed.englishValue);
    this.onValidatorChange();

    if (parsed.isValid) {
      this.displayValue.set(parsed.displayPersian);
    } else {
      this.displayValue.set(toPersianDigits(rawVal));
    }
  }

  onBlur(): void {
    this.onTouched();
    const parsed = parseTimeInput(this.currentValue());
    if (parsed.isEmpty) {
      this.displayValue.set('');
    } else {
      this.displayValue.set(parsed.displayPersian);
    }
  }
}
