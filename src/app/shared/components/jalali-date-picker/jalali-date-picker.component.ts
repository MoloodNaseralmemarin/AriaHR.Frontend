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
import { toPersianDigits, normalizePersianDigits, normalizeMobileNumber } from '../../utils/mobile-number.util';

const PERSIAN_MONTH_NAMES = [
  { value: 1, label: 'فروردین' },
  { value: 2, label: 'اردیبهشت' },
  { value: 3, label: 'خرداد' },
  { value: 4, label: 'تیر' },
  { value: 5, label: 'مرداد' },
  { value: 6, label: 'شهریور' },
  { value: 7, label: 'مهر' },
  { value: 8, label: 'آبان' },
  { value: 9, label: 'آذر' },
  { value: 10, label: 'دی' },
  { value: 11, label: 'بهمن' },
  { value: 12, label: 'اسفند' },
];

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
    <div dir="rtl" class="w-full space-y-2">
      <!-- Direct Segmented Inputs for Year, Month, Day in RTL order: Year (سال), Month (ماه), Day (روز) -->
      <div class="grid grid-cols-3 gap-2.5 items-end">
        <!-- Year Input (سال) -->
        <div class="min-w-0">
          <label class="block text-xs font-semibold text-slate-700 mb-1 truncate whitespace-nowrap overflow-visible">
            سال
          </label>
          <input
            type="text"
            placeholder="مثال: ۱۳۷۰"
            maxlength="4"
            [disabled]="disabled"
            [value]="yearInput()"
            (input)="onSegmentInput('year', $event)"
            (blur)="onBlur()"
            dir="ltr"
            class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-sm text-slate-800 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 font-sans"
          />
        </div>

        <!-- Month Dropdown / Selection (ماه) -->
        <div class="min-w-0">
          <label class="block text-xs font-semibold text-slate-700 mb-1 truncate whitespace-nowrap overflow-visible">
            ماه
          </label>
          <select
            [disabled]="disabled"
            [value]="monthSelect()"
            (change)="onSegmentSelect('month', $event)"
            (blur)="onBlur()"
            class="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-xs text-slate-800 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 font-sans"
          >
            <option value="">انتخاب ماه</option>
            <option *ngFor="let m of monthOptions" [value]="m.value">
              {{ m.value }} - {{ m.label }}
            </option>
          </select>
        </div>

        <!-- Day Input (روز) -->
        <div class="min-w-0">
          <label class="block text-xs font-semibold text-slate-700 mb-1 truncate whitespace-nowrap overflow-visible">
            روز
          </label>
          <input
            type="text"
            placeholder="۱-۳۱"
            maxlength="2"
            [disabled]="disabled"
            [value]="dayInput()"
            (input)="onSegmentInput('day', $event)"
            (blur)="onBlur()"
            dir="ltr"
            class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-sm text-slate-800 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 font-sans"
          />
        </div>
      </div>

      <!-- Formatted Display Preview (YYYY/MM/DD) -->
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
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-left text-xs text-slate-700 transition duration-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 font-sans"
        />
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class JalaliDatePickerComponent implements ControlValueAccessor, Validator {
  private readonly persianDateService = inject(PersianDateService);

  @Input() id = '';
  @Input() placeholder = 'سال/ماه/روز (مثال: ۱۳۷۰/۱۲/۳۰)';
  @Input() digitsFormat: 'persian' | 'ascii' = 'persian';
  @Input() dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD' = 'DD-MM-YYYY';

  readonly monthOptions = PERSIAN_MONTH_NAMES;

  disabled = false;

  // Holds the formatted Jalali string for UI preview (e.g. "۱۳۷۰/۱۲/۳۰")
  readonly displayValue = signal<string>('');

  // Individual segment signals for Year, Month, Day
  readonly yearInput = signal<string>('');
  readonly monthSelect = signal<string>('');
  readonly dayInput = signal<string>('');

  // Internal storage for model value in Gregorian format (e.g. "1991-03-21")
  private gregorianValue: string | null = null;

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    if (this.gregorianValue === val && (this.displayValue() || this.yearInput())) {
      return; // Prevent overwriting active user typing
    }

    this.gregorianValue = val;
    if (val) {
      const jalaliStr = this.persianDateService.toJalaliString(
        val,
        this.digitsFormat,
        'YYYY-MM-DD'
      ).replace(/-/g, '/');
      this.displayValue.set(jalaliStr);
      this.updateSegmentsFromJalali(jalaliStr);
    } else {
      this.displayValue.set('');
      this.yearInput.set('');
      this.monthSelect.set('');
      this.dayInput.set('');
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

  private updateSegmentsFromJalali(jalaliStr: string): void {
    if (!jalaliStr) {
      this.yearInput.set('');
      this.monthSelect.set('');
      this.dayInput.set('');
      return;
    }

    const asciiStr = normalizePersianDigits(jalaliStr.trim());
    const parts = asciiStr.split(/[-/]/);

    const formatDigits = (str: string) =>
      this.digitsFormat === 'persian' ? toPersianDigits(str) : str;

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        this.yearInput.set(formatDigits(parts[0]));
        this.monthSelect.set(parts[1] ? String(parseInt(parts[1], 10)) : '');
        this.dayInput.set(formatDigits(parts[2]));
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        this.dayInput.set(formatDigits(parts[0]));
        this.monthSelect.set(parts[1] ? String(parseInt(parts[1], 10)) : '');
        this.yearInput.set(formatDigits(parts[2]));
      } else {
        this.yearInput.set(formatDigits(parts[0]));
        this.monthSelect.set(parts[1] ? String(parseInt(parts[1], 10)) : '');
        this.dayInput.set(formatDigits(parts[2]));
      }
    }
  }

  onSegmentInput(type: 'day' | 'year', event: Event): void {
    const rawVal = (event.target as HTMLInputElement).value;
    const asciiDigits = normalizeMobileNumber(rawVal);
    const formatted = this.digitsFormat === 'persian' ? toPersianDigits(asciiDigits) : asciiDigits;

    if (type === 'year') {
      this.yearInput.set(formatted);
    } else if (type === 'day') {
      this.dayInput.set(formatted);
    }

    this.rebuildJalaliFromSegments();
  }

  onSegmentSelect(type: 'month', event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.monthSelect.set(val);
    this.rebuildJalaliFromSegments();
  }

  private rebuildJalaliFromSegments(): void {
    const asciiYear = normalizePersianDigits(this.yearInput()).trim();
    const asciiMonthNum = this.monthSelect().trim();
    const asciiDay = normalizePersianDigits(this.dayInput()).trim();

    if (!asciiYear && !asciiMonthNum && !asciiDay) {
      this.displayValue.set('');
      this.gregorianValue = null;
      this.onChange(null);
      return;
    }

    const yearVal = asciiYear;
    const monthPad = asciiMonthNum ? asciiMonthNum.padStart(2, '0') : '';
    const dayPad = asciiDay ? asciiDay.padStart(2, '0') : '';

    const formatDigits = (str: string) =>
      this.digitsFormat === 'persian' ? toPersianDigits(str) : str;

    let displayParts: string[] = [];

    if (yearVal) displayParts.push(formatDigits(yearVal));
    if (monthPad) displayParts.push(formatDigits(monthPad));
    if (dayPad) displayParts.push(formatDigits(dayPad));

    const display = displayParts.join('/');
    this.displayValue.set(display);

    if (asciiYear && asciiYear.length === 4 && asciiMonthNum && asciiDay) {
      const jy = parseInt(asciiYear, 10);
      const jm = parseInt(asciiMonthNum, 10);
      const jd = parseInt(asciiDay, 10);

      if (this.persianDateService.isValidJalaliDate(jy, jm, jd)) {
        const gVal = this.persianDateService.toGregorianString(`${asciiYear}/${asciiMonthNum}/${asciiDay}`);
        this.gregorianValue = gVal;
        this.onChange(gVal);
      } else {
        this.gregorianValue = null;
        this.onChange(null);
      }
    } else {
      this.gregorianValue = null;
      this.onChange(null);
    }
  }

  onInputChange(event: Event): void {
    const rawInput = (event.target as HTMLInputElement).value;
    const asciiInput = normalizePersianDigits(rawInput);

    const formatDigits = (str: string) =>
      this.digitsFormat === 'persian' ? toPersianDigits(str) : str;

    let formattedDisplay = '';
    const parts = asciiInput.split(/[-/]/);

    if (parts.length === 3) {
      let y = '', m = '', d = '';
      if (parts[0].length === 4) {
        y = parts[0];
        m = parts[1];
        d = parts[2];
      } else if (parts[2].length === 4) {
        d = parts[0];
        m = parts[1];
        y = parts[2];
      } else {
        y = parts[0];
        m = parts[1];
        d = parts[2];
      }
      formattedDisplay = [formatDigits(y), formatDigits(m), formatDigits(d)]
        .filter(Boolean)
        .join('/');
    } else {
      const digitsOnly = normalizeMobileNumber(rawInput);
      if (digitsOnly.length <= 4) {
        formattedDisplay = formatDigits(digitsOnly);
      } else if (digitsOnly.length <= 6) {
        formattedDisplay = `${formatDigits(digitsOnly.slice(0, 4))}/${formatDigits(digitsOnly.slice(4))}`;
      } else {
        formattedDisplay = `${formatDigits(digitsOnly.slice(0, 4))}/${formatDigits(digitsOnly.slice(4, 6))}/${formatDigits(digitsOnly.slice(6, 8))}`;
      }
    }

    this.displayValue.set(formattedDisplay);
    this.updateSegmentsFromJalali(formattedDisplay);

    const gVal = this.persianDateService.toGregorianString(formattedDisplay);
    this.gregorianValue = gVal;
    this.onChange(gVal);
  }

  onBlur(): void {
    this.onTouched();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    const hasAnyInput = this.displayValue() || this.yearInput() || this.monthSelect() || this.dayInput();

    if (!val && !hasAnyInput) {
      return null; // Let Required validator handle empty state
    }

    if (hasAnyInput && !this.gregorianValue) {
      return { invalidJalaliDate: true };
    }

    return null;
  }
}
