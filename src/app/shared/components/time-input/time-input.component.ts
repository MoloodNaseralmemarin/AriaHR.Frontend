import { Component, ChangeDetectionStrategy, forwardRef, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { toPersianDigits, normalizePersianDigits } from '../../utils/mobile-number.util';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative">
      <input
        type="text"
        [value]="displayValue()"
        (input)="onInput($event)"
        (blur)="onBlur()"
        placeholder="۰۸:۳۰"
        dir="ltr"
        maxLength="5"
        class="w-full rounded-xl border border-slate-200 p-3 text-center text-sm font-medium text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeInputComponent implements ControlValueAccessor {
  readonly displayValue = signal<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    if (!val) {
      this.displayValue.set('');
      return;
    }
    const normalized = normalizePersianDigits(val);
    this.displayValue.set(toPersianDigits(normalized));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const rawVal = (event.target as HTMLInputElement).value || '';
    const ascii = normalizePersianDigits(rawVal).replace(/[^0-9:]/g, '');

    // Format auto-colon if user types 4 digits e.g. 0830 -> 08:30
    let formattedAscii = ascii;
    if (/^\d{4}$/.test(ascii)) {
      formattedAscii = `${ascii.slice(0, 2)}:${ascii.slice(2, 4)}`;
    }

    this.displayValue.set(toPersianDigits(formattedAscii));

    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formattedAscii)) {
      // Pad single digit hour e.g. 8:30 -> 08:30
      const [h, m] = formattedAscii.split(':');
      const padAscii = `${h.padStart(2, '0')}:${m}`;
      this.onChange(padAscii);
    } else {
      this.onChange(formattedAscii);
    }
  }

  onBlur(): void {
    this.onTouched();
  }
}
