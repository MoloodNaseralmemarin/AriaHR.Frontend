import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div dir="rtl" class="relative w-full text-right" (keydown)="onKeyDown($event)">
      <!-- Trigger Button -->
      <button
        type="button"
        [disabled]="disabled"
        (click)="toggleOpen()"
        (blur)="onBlur()"
        [class]="buttonClasses()"
        [attr.aria-expanded]="isOpen()"
        aria-haspopup="listbox"
      >
        <span class="truncate" [class.text-slate-400]="!selectedOption()">
          {{ selectedOption() ? selectedOption()!.label : placeholder }}
        </span>
        <span class="pointer-events-none flex items-center pr-2 text-slate-400 transition-transform duration-200" [class.rotate-180]="isOpen()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      <!-- Options Dropdown Panel -->
      <div
        *ngIf="isOpen()"
        role="listbox"
        class="absolute right-0 left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-950/5 transition duration-150 ease-out focus:outline-none"
        style="font-family: 'IRANSans', sans-serif !important;"
      >
        <div
          *ngFor="let option of normalizedOptions(); let i = index"
          role="option"
          [attr.aria-selected]="isSelected(option)"
          [class.bg-indigo-50]="isSelected(option) || highlightedIndex() === i"
          [class.text-indigo-600]="isSelected(option)"
          [class.font-semibold]="isSelected(option)"
          [class.text-slate-800]="!isSelected(option)"
          [class.opacity-50]="option.disabled"
          [class.cursor-not-allowed]="option.disabled"
          (click)="selectOption(option)"
          (mouseenter)="highlightedIndex.set(i)"
          class="group relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-colors duration-150 hover:bg-indigo-50 hover:text-indigo-600"
          style="font-family: 'IRANSans', sans-serif !important;"
        >
          <span class="truncate" style="font-family: 'IRANSans', sans-serif !important;">{{ option.label }}</span>
          <svg
            *ngIf="isSelected(option)"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2.5"
            stroke="currentColor"
            class="h-4 w-4 text-indigo-600 shrink-0"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <div *ngIf="normalizedOptions().length === 0" class="px-3 py-3 text-center text-xs text-slate-400">
          گزینه‌ای یافت نشد
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      font-family: 'IRANSans', sans-serif !important;
    }
  `],
})
export class CustomSelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  @Input() options: SelectOption[] | any[] = [];
  @Input() placeholder = 'انتخاب کنید...';
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() triggerClass = '';
  @Input() valueProperty = 'value';
  @Input() labelProperty = 'label';

  @Output() selectionChange = new EventEmitter<any>();

  readonly isOpen = signal(false);
  readonly selectedValue = signal<any>(null);
  readonly highlightedIndex = signal<number>(-1);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  readonly normalizedOptions = computed<SelectOption[]>(() => {
    if (!Array.isArray(this.options)) return [];
    return this.options.map((opt) => {
      if (opt !== null && typeof opt === 'object' && !('label' in opt && 'value' in opt)) {
        return {
          value: opt[this.valueProperty],
          label: opt[this.labelProperty],
          disabled: !!opt.disabled,
        };
      }
      return opt as SelectOption;
    });
  });

  readonly selectedOption = computed<SelectOption | null>(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined || val === '') return null;
    return (
      this.normalizedOptions().find((opt) => opt.value === val || String(opt.value) === String(val)) || null
    );
  });

  readonly buttonClasses = computed(() => {
    const base =
      'flex w-full items-center justify-between rounded-xl border bg-white px-3 py-3 text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';
    const border = this.invalid
      ? 'border-rose-500 focus:border-rose-500'
      : this.isOpen()
      ? 'border-blue-500 ring-2 ring-blue-500/20'
      : 'border-slate-200 focus:border-blue-500';
    return `${base} ${border} ${this.triggerClass}`.trim();
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.onTouched();
      }
    }
  }

  writeValue(val: any): void {
    this.selectedValue.set(val);
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleOpen(): void {
    if (this.disabled) return;
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      const idx = this.normalizedOptions().findIndex((opt) => this.isSelected(opt));
      this.highlightedIndex.set(idx >= 0 ? idx : 0);
    } else {
      this.onTouched();
    }
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen.set(false);
    this.onTouched();
  }

  isSelected(option: SelectOption): boolean {
    const current = this.selectedValue();
    return current === option.value || (current !== null && current !== undefined && String(current) === String(option.value));
  }

  onBlur(): void {
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.isOpen.set(true);
        this.highlightedIndex.set(0);
      } else {
        const next = Math.min(this.highlightedIndex() + 1, this.normalizedOptions().length - 1);
        this.highlightedIndex.set(next);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.isOpen()) {
        const prev = Math.max(this.highlightedIndex() - 1, 0);
        this.highlightedIndex.set(prev);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.isOpen.set(true);
      } else if (this.highlightedIndex() >= 0 && this.highlightedIndex() < this.normalizedOptions().length) {
        this.selectOption(this.normalizedOptions()[this.highlightedIndex()]);
      }
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.onTouched();
      }
    }
  }
}
