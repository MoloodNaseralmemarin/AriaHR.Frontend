import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
  FormsModule,
} from '@angular/forms';
import { PersianDateService } from '../../../core/services/persian-date.service';
import { toPersianDigits, normalizeMobileNumber } from '../../utils/mobile-number.util';

@Component({
  selector: 'app-jalali-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => JalaliDatePickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => JalaliDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full">
      <input
        type="text"
        [id]="id"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="displayValue()"
        (input)="onInputChange($event)"
        (blur)="onBlur()"
        dir="ltr"
        class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
      />
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </div>
    </div>
  `,
  styles: [],
})
export class JalaliDatePickerComponent implements ControlValueAccessor, Validator {
  private readonly persianDateService = inject(PersianDateService);

  @Input() id = '';
  @Input() placeholder = ' روز-ماه-سال (مثال: ۱۵-۰۲-۱۴۰۵)';
  @Input() digitsFormat: 'persian' | 'ascii' = 'persian';

  disabled = false;

  // Holds the formatted Jalali string in Persian digits for UI display
  readonly displayValue = signal<string>('');

  // Internal storage for the model value in Gregorian format (e.g. "2026-05-05")
  private gregorianValue: string | null = null;

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    this.gregorianValue = val;
    if (val) {
      const usePersianDigits = this.digitsFormat === 'persian';
      const jalaliStr = this.persianDateService.toJalaliString(val, usePersianDigits);
      this.displayValue.set(jalaliStr);
    } else {
      this.displayValue.set('');
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const rawInput = (event.target as HTMLInputElement).value;
    const asciiInput = normalizeMobileNumber(rawInput);
    const formatFn = (str: string) => (this.digitsFormat === 'ascii' ? str : toPersianDigits(str));

    // Auto-format digits into DD-MM-YYYY format if user types continuously
    let formattedDisplay = '';
    if (asciiInput.length <= 2) {
      formattedDisplay = formatFn(asciiInput);
    } else if (asciiInput.length <= 4) {
      formattedDisplay = `${formatFn(asciiInput.slice(0, 2))}-${formatFn(asciiInput.slice(2))}`;
    } else {
      formattedDisplay = `${formatFn(asciiInput.slice(0, 2))}-${formatFn(asciiInput.slice(2, 4))}-${formatFn(asciiInput.slice(4, 8))}`;
    }

    // Preserve dash if user typed dashes or slashes explicitly
    if (rawInput.includes('-') || rawInput.includes('/')) {
      // Clean digit parts separated by dash/slash
      const parts = rawInput.split(/[-/]/).map((p) => normalizeMobileNumber(p));
      formattedDisplay = parts.map((p) => formatFn(p)).join('-');
    }

    this.displayValue.set(formattedDisplay);

    // Convert display Jalali to Gregorian for forms model
    const gVal = this.persianDateService.toGregorianString(formattedDisplay);
    this.gregorianValue = gVal;
    this.onChange(gVal);
  }

  onBlur(): void {
    this.onTouched();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (!val && !this.displayValue()) {
      return null; // Let Required validator handle empty state
    }

    if (this.displayValue() && !this.gregorianValue) {
      return { invalidJalaliDate: true };
    }

    return null;
  }
}
