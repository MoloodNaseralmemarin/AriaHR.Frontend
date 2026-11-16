import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  computed,
  forwardRef,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import { toPersianDigits } from '../../utils/mobile-number.util';
import { toAsciiDigits } from '../../utils/time.util';
import {
  TIME_INPUT_ERROR_MESSAGE,
  completeTimeDigits,
  extractTimeDigits,
  formatTimeDigits,
  isValidTime24h,
  normalizeTimeValue,
} from '../../utils/time-input.util';

/**
 * HH:mm input that never requires the user to type `:`.
 *
 * Typing `1622` produces `16:22`, `0930` produces `09:30` and short values are
 * completed on blur (`7` → `07:00`, `730` → `07:30`). Out-of-range values such
 * as `2565` are rejected with a Persian message and the control is marked
 * invalid, while the emitted form value always stays in the backend `HH:mm`
 * contract (ASCII digits).
 */
@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative">
      <input
        #timeInput
        type="text"
        inputmode="numeric"
        autocomplete="off"
        [id]="id"
        [disabled]="disabled"
        [placeholder]="placeholder"
        [attr.aria-label]="ariaLabel || null"
        [attr.aria-invalid]="errorVisible()"
        maxlength="5"
        dir="ltr"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (keydown.enter)="onEnter()"
        [ngClass]="
          errorVisible()
            ? 'border-rose-300 bg-rose-50/30 text-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20'
        "
        class="w-full rounded-xl border p-3 text-center text-sm font-medium transition focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </div>
    @if (errorVisible()) {
      <p class="mt-1.5 text-xs font-medium text-rose-600">{{ errorMessage }}</p>
    }
  `,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeInputComponent implements ControlValueAccessor, Validator, AfterViewInit {
  @Input() id = '';
  @Input() placeholder = 'مثلاً ۱۶:۲۲';
  @Input() ariaLabel = '';

  readonly displayValue = signal<string>('');
  readonly errorVisible = computed(() => this.touched() && this.invalid());
  readonly errorMessage = TIME_INPUT_ERROR_MESSAGE;

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('timeInput');

  private readonly invalid = signal(false);
  private readonly touched = signal(false);

  private digits = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.render(this.displayValue());
  }

  writeValue(value: string | null | undefined): void {
    const ascii = toAsciiDigits(value).trim();

    if (!ascii) {
      this.digits = '';
      this.invalid.set(false);
      this.render('');
      return;
    }

    const normalized = normalizeTimeValue(ascii);
    const formatted = normalized ?? ascii.replace(/[^0-9:]/g, '');
    this.digits = extractTimeDigits(formatted);
    this.invalid.set(this.digits.length === 4 && !isValidTime24h(formatted));
    this.render(formatTimeDigits(this.digits));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }
    return isValidTime24h(String(value)) ? null : { timeInvalid: true };
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value ?? '';
    const caret = input.selectionStart ?? rawValue.length;
    const digitsBeforeCaret = extractTimeDigits(rawValue.slice(0, caret)).length;

    this.digits = extractTimeDigits(rawValue);
    const formatted = formatTimeDigits(this.digits);

    // Keep the caret next to the digit the user just typed, accounting for the
    // automatically inserted colon.
    this.render(formatted, digitsBeforeCaret);

    if (this.digits.length === 4) {
      this.invalid.set(!isValidTime24h(formatted));
      this.onChange(formatted);
      return;
    }

    // A partially typed time must never reach the backend `HH:mm` contract.
    this.invalid.set(false);
    this.onChange('');
  }

  onBlur(): void {
    this.touched.set(true);

    if (!this.digits) {
      this.invalid.set(false);
      this.render('');
      this.onChange('');
      this.onTouched();
      return;
    }

    const completed = completeTimeDigits(this.digits);
    this.digits = extractTimeDigits(completed);
    this.invalid.set(!isValidTime24h(completed));
    this.render(completed);
    this.onChange(completed);
    this.onTouched();
  }

  /** Completes the value on Enter so an implicit form submit gets a valid time. */
  onEnter(): void {
    this.onBlur();
  }

  private render(formattedAscii: string, digitsBeforeCaret?: number): void {
    const display = toPersianDigits(formattedAscii);
    this.displayValue.set(display);

    const input = this.inputEl()?.nativeElement;
    if (!input) {
      return;
    }

    input.value = display;

    if (digitsBeforeCaret !== undefined) {
      const caret = digitsBeforeCaret <= 2 ? digitsBeforeCaret : digitsBeforeCaret + 1;
      const position = Math.min(caret, display.length);
      input.setSelectionRange(position, position);
    }
  }
}
