import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  forwardRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianDigits(str: string): string {
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

function toAsciiDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 1776)
  );
}

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all bg-white w-full"
      [ngClass]="{
        'border-blue-500 ring-2 ring-blue-500/20': isFocused() && !isInvalid,
        'border-slate-300 hover:border-slate-400': !isFocused() && !isInvalid,
        'border-rose-500 ring-2 ring-rose-500/20': isInvalid,
        'opacity-60 pointer-events-none bg-slate-50': disabled
      }"
      dir="rtl"
    >
      <!-- Hour box -->
      <div class="flex flex-col items-center">
        <span class="text-[11px] text-slate-500 font-medium select-none mb-0.5">ساعت</span>
        <input
          #hourInput
          type="text"
          inputmode="numeric"
          maxlength="2"
          placeholder="۰۰"
          [value]="displayHour()"
          (focus)="onInputFocus('hour')"
          (blur)="onInputBlur('hour')"
          (input)="onHourInput($event)"
          (keydown)="onHourKeyDown($event)"
          class="w-12 text-center font-semibold text-slate-900 bg-transparent outline-none focus:bg-slate-100 rounded-md py-0.5 text-base tracking-wider"
          [disabled]="disabled()"
          dir="ltr"
        />
      </div>

      <span class="text-slate-400 font-bold text-lg leading-none mt-4 select-none">:</span>

      <!-- Minute box -->
      <div class="flex flex-col items-center">
        <span class="text-[11px] text-slate-500 font-medium select-none mb-0.5">دقیقه</span>
        <input
          #minuteInput
          type="text"
          inputmode="numeric"
          maxlength="2"
          placeholder="۰۰"
          [value]="displayMinute()"
          (focus)="onInputFocus('minute')"
          (blur)="onInputBlur('minute')"
          (input)="onMinuteInput($event)"
          (keydown)="onMinuteKeyDown($event)"
          class="w-12 text-center font-semibold text-slate-900 bg-transparent outline-none focus:bg-slate-100 rounded-md py-0.5 text-base tracking-wider"
          [disabled]="disabled()"
          dir="ltr"
        />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        width: 100%;
      }
    `,
  ],
})
export class TimeInputComponent implements ControlValueAccessor {
  @Input() isInvalid = false;

  @ViewChild('hourInput') hourInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('minuteInput') minuteInputRef!: ElementRef<HTMLInputElement>;

  readonly hour = signal<string>('');
  readonly minute = signal<string>('');
  readonly disabled = signal<boolean>(false);

  readonly focusedBox = signal<'hour' | 'minute' | null>(null);

  readonly isFocused = signal<boolean>(false);

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly displayHour = signal<string>('');
  readonly displayMinute = signal<string>('');

  writeValue(val: string | null): void {
    if (!val) {
      this.hour.set('');
      this.minute.set('');
      this.displayHour.set('');
      this.displayMinute.set('');
      return;
    }

    const ascii = toAsciiDigits(val.trim());
    const parts = ascii.split(':');
    if (parts.length === 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      this.hour.set(h);
      this.minute.set(m);
      this.displayHour.set(toPersianDigits(h));
      this.displayMinute.set(toPersianDigits(m));
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInputFocus(box: 'hour' | 'minute'): void {
    this.focusedBox.set(box);
    this.isFocused.set(true);
  }

  onInputBlur(box: 'hour' | 'minute'): void {
    setTimeout(() => {
      if (this.focusedBox() === box) {
        this.focusedBox.set(null);
        this.isFocused.set(false);
        this.onTouched();
        this.normalizeAndEmit();
      }
    }, 100);
  }

  onHourInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = toAsciiDigits(input.value).replace(/\D/g, '');

    if (raw.length > 2) raw = raw.slice(0, 2);

    let hNum = parseInt(raw, 10);
    if (!isNaN(hNum)) {
      if (hNum > 23) {
        raw = '23';
      }
    }

    this.hour.set(raw);
    this.displayHour.set(toPersianDigits(raw));
    input.value = toPersianDigits(raw);

    if (raw.length === 2) {
      this.minuteInputRef.nativeElement.focus();
      this.minuteInputRef.nativeElement.select();
    }

    this.emitValue();
  }

  onMinuteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = toAsciiDigits(input.value).replace(/\D/g, '');

    if (raw.length > 2) raw = raw.slice(0, 2);

    let mNum = parseInt(raw, 10);
    if (!isNaN(mNum)) {
      if (mNum > 59) {
        raw = '59';
      }
    }

    this.minute.set(raw);
    this.displayMinute.set(toPersianDigits(raw));
    input.value = toPersianDigits(raw);

    this.emitValue();
  }

  onHourKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.minuteInputRef.nativeElement.focus();
      this.minuteInputRef.nativeElement.select();
    }
  }

  onMinuteKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.minute()) {
      event.preventDefault();
      this.hourInputRef.nativeElement.focus();
      this.hourInputRef.nativeElement.select();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.hourInputRef.nativeElement.focus();
      this.hourInputRef.nativeElement.select();
    }
  }

  private normalizeAndEmit(): void {
    let h = this.hour();
    let m = this.minute();

    if (h) {
      h = h.padStart(2, '0');
      this.hour.set(h);
      this.displayHour.set(toPersianDigits(h));
    }
    if (m) {
      m = m.padStart(2, '0');
      this.minute.set(m);
      this.displayMinute.set(toPersianDigits(m));
    }

    this.emitValue();
  }

  private emitValue(): void {
    const h = this.hour();
    const m = this.minute();

    if (!h && !m) {
      this.onChange('');
      return;
    }

    const hFormatted = h.padStart(2, '0');
    const mFormatted = m.padStart(2, '0');

    this.onChange(`${hFormatted}:${mFormatted}`);
  }
}
