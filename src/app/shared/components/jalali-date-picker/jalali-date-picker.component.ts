import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  inject,
  signal,
  computed,
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
      <!-- Direct Segmented Inputs for Year, Month, Day in RTL order -->
      <div class="grid grid-cols-3 gap-2">
        <!-- Day Input (روز) -->
        <div>
          <label class="block text-[11px] font-medium text-slate-500 mb-1">
            روز
          </label>
          <input
            type="text"
            placeholder="روز (۱-۳۱)"
            maxlength="2"
            [disabled]="disabled"
            [value]="dayInput()"
            (input)="onSegmentInput('day', $event)"
            (blur)="onBlur()"
            dir="ltr"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>

        <!-- Month Dropdown / Selection (ماه) -->
        <div>
          <label class="block text-[11px] font-medium text-slate-500 mb-1">
            ماه
          </label>
          <select
            [disabled]="disabled"
            [value]="monthSelect()"
            (change)="onSegmentSelect('month', $event)"
            (blur)="onBlur()"
            class="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-xs font-medium text-slate-800 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">انتخاب ماه</option>
            <option *ngFor="let m of monthOptions" [value]="m.value">
              {{ m.value | number }} - {{ m.label }}
            </option>
          </select>
        </div>

        <!-- Year Input (سال) -->
        <div>
          <label class="block text-[11px] font-medium text-slate-500 mb-1">
            سال
          </label>
          <input
            type="text"
            placeholder="سال (مثال: ۱۳۷۰)"
            maxlength="4"
            [disabled]="disabled"
            [value]="yearInput()"
            (input)="onSegmentInput('year', $event)"
            (blur)="onBlur()"
            dir="ltr"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800 transition duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>
      </div>

      <!-- Quick Continuous Input & Formatted Jalali Display Preview -->
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
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-left text-xs text-slate-700 transition duration-200 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-400"
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
  @Input() placeholder = 'روز-ماه-سال (مثال: ۱۵-۰۲-۱۴۰۵)';
  @Input() digitsFormat: 'persian' | 'ascii' = 'persian';
  @Input() dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD' = 'DD-MM-YYYY';

  readonly monthOptions = PERSIAN_MONTH_NAMES;

  disabled = false;

  // Holds the formatted Jalali string for continuous UI display
  readonly displayValue = signal<string>('');

  // Individual segment signals for Day, Month, Year
  readonly dayInput = signal<string>('');
  readonly monthSelect = signal<string>('');
  readonly yearInput = signal<string>('');

  // Internal storage for the model value in Gregorian format (e.g. "2026-05-05")
  private gregorianValue: string | null = null;

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    this.gregorianValue = val;
    if (val) {
      const jalaliStr = this.persianDateService.toJalaliString(
        val,
        this.digitsFormat,
        this.dateFormat
      );
      this.displayValue.set(jalaliStr);
      this.updateSegmentsFromJalali(jalaliStr);
    } else {
      this.displayValue.set('');
      this.dayInput.set('');
      this.monthSelect.set('');
      this.yearInput.set('');
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
      this.dayInput.set('');
      this.monthSelect.set('');
      this.yearInput.set('');
      return;
    }

    const asciiStr = normalizePersianDigits(jalaliStr.trim());
    const parts = asciiStr.split(/[-/]/);

    const formatDigits = (str: string) =>
      this.digitsFormat === 'persian' ? toPersianDigits(str) : str;

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        this.yearInput.set(formatDigits(parts[0]));
        this.monthSelect.set(parts[1] ? String(parseInt(parts[1], 10)) : '');
        this.dayInput.set(formatDigits(parts[2]));
      } else {
        // DD-MM-YYYY
        this.dayInput.set(formatDigits(parts[0]));
        this.monthSelect.set(parts[1] ? String(parseInt(parts[1], 10)) : '');
        this.yearInput.set(formatDigits(parts[2]));
      }
    }
  }

  onSegmentInput(type: 'day' | 'year', event: Event): void {
    const rawVal = (event.target as HTMLInputElement).value;
    const asciiDigits = normalizeMobileNumber(rawVal);
    const formatted = this.digitsFormat === 'persian' ? toPersianDigits(asciiDigits) : asciiDigits;

    if (type === 'day') {
      this.dayInput.set(formatted);
    } else if (type === 'year') {
      this.yearInput.set(formatted);
    }

    this.rebuildJalaliFromSegments();
  }

  onSegmentSelect(type: 'month', event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.monthSelect.set(val);
    this.rebuildJalaliFromSegments();
  }

  private rebuildJalaliFromSegments(): void {
    const asciiDay = normalizePersianDigits(this.dayInput()).trim();
    const asciiMonthNum = this.monthSelect().trim();
    const asciiYear = normalizePersianDigits(this.yearInput()).trim();

    if (!asciiDay && !asciiMonthNum && !asciiYear) {
      this.displayValue.set('');
      this.gregorianValue = null;
      this.onChange(null);
      return;
    }

    const dayPad = asciiDay ? asciiDay.padStart(2, '0') : '';
    const monthPad = asciiMonthNum ? asciiMonthNum.padStart(2, '0') : '';
    const yearVal = asciiYear;

    const formatDigits = (str: string) =>
      this.digitsFormat === 'persian' ? toPersianDigits(str) : str;

    let display = '';

    if (dayPad || monthPad || yearVal) {
      if (this.dateFormat === 'YYYY-MM-DD') {
        display = [formatDigits(yearVal), formatDigits(monthPad), formatDigits(dayPad)]
          .filter(Boolean)
          .join('-');
      } else {
        display = [formatDigits(dayPad), formatDigits(monthPad), formatDigits(yearVal)]
          .filter(Boolean)
          .join('-');
      }
    }

    this.displayValue.set(display);

    if (asciiDay && asciiMonthNum && asciiYear && asciiYear.length === 4) {
      const gVal = this.persianDateService.toGregorianString(`${asciiDay}-${asciiMonthNum}-${asciiYear}`);
      this.gregorianValue = gVal;
      this.onChange(gVal);
    } else {
      this.gregorianValue = null;
      this.onChange(null);
    }
  }

  onInputChange(event: Event): void {
    const rawInput = (event.target as HTMLInputElement).value;
    const asciiInput = normalizeMobileNumber(rawInput);

    const formatDigits = (str: string) =>
      this.digitsFormat === 'persian' ? toPersianDigits(str) : str;

    let formattedDisplay = '';

    if (this.dateFormat === 'YYYY-MM-DD') {
      // Auto-format continuous digits YYYYMMDD
      if (asciiInput.length <= 4) {
        formattedDisplay = formatDigits(asciiInput);
      } else if (asciiInput.length <= 6) {
        formattedDisplay = `${formatDigits(asciiInput.slice(0, 4))}-${formatDigits(asciiInput.slice(4))}`;
      } else {
        formattedDisplay = `${formatDigits(asciiInput.slice(0, 4))}-${formatDigits(asciiInput.slice(4, 6))}-${formatDigits(asciiInput.slice(6, 8))}`;
      }
    } else {
      // Auto-format continuous digits DDMMYYYY
      if (asciiInput.length <= 2) {
        formattedDisplay = formatDigits(asciiInput);
      } else if (asciiInput.length <= 4) {
        formattedDisplay = `${formatDigits(asciiInput.slice(0, 2))}-${formatDigits(asciiInput.slice(2))}`;
      } else {
        formattedDisplay = `${formatDigits(asciiInput.slice(0, 2))}-${formatDigits(asciiInput.slice(2, 4))}-${formatDigits(asciiInput.slice(4, 8))}`;
      }
    }

    // Preserve explicit dash or slash separators typed by user
    if (rawInput.includes('-') || rawInput.includes('/')) {
      const parts = rawInput.split(/[-/]/).map((p) => normalizeMobileNumber(p));
      formattedDisplay = parts.map((p) => formatDigits(p)).join('-');
    }

    this.displayValue.set(formattedDisplay);
    this.updateSegmentsFromJalali(formattedDisplay);

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
    const hasAnyInput = this.displayValue() || this.dayInput() || this.monthSelect() || this.yearInput();

    if (!val && !hasAnyInput) {
      return null; // Let Required validator handle empty state
    }

    if (hasAnyInput && !this.gregorianValue) {
      return { invalidJalaliDate: true };
    }

    return null;
  }
}
