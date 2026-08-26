import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, OtpVerifyResponse } from '../../../../core/auth/auth.service';
import { normalizeMobileNumber, toPersianDigits } from '../../../../shared/utils/mobile-number.util';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const COUNTDOWN_SECONDS = 120;

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function extractRawDigits(raw: string): string[] {
  if (!raw) return [];
  const result: string[] = [];
  for (const char of raw) {
    if (
      PERSIAN_DIGITS.includes(char) ||
      ARABIC_DIGITS.includes(char) ||
      (char >= '0' && char <= '9')
    ) {
      result.push(char);
    }
  }
  return result;
}

@Component({
  selector: 'app-verify-otp-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp-page.component.html',
  styleUrl: './verify-otp-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly mobileNumber = signal('09123456789');
  readonly digits = signal<string[]>(['', '', '', '']);
  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal('');
  readonly countdown = signal(COUNTDOWN_SECONDS);
  readonly hasFailedAttempt = signal(false);

  private timerRef: ReturnType<typeof setInterval> | null = null;

  readonly formattedCountdown = computed(() => {
    const total = this.countdown();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const padMin = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const padSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return toPersianDigits(`${padMin}:${padSec}`);
  });

  readonly fullCode = computed(() => normalizeMobileNumber(this.digits().join('')));

  readonly isCodeComplete = computed(() => this.fullCode().length === 4);

  readonly isSubmitDisabled = computed(
    () => !this.isCodeComplete() || this.submitState() === 'loading'
  );

  ngOnInit(): void {
    const navState = history.state;
    if (navState && navState.mobileNumber) {
      this.mobileNumber.set(navState.mobileNumber);
    }
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const firstInput = this.otpInputs.first?.nativeElement;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  getDigitLabel(index: number): string {
    const labels = ['اول', 'دوم', 'سوم', 'چهارم'];
    return labels[index] || `${index + 1}`;
  }

  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input?.select();
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawDigits = extractRawDigits(input.value);

    if (rawDigits.length > 1) {
      this.handleMultiDigitInsert(rawDigits, index);
      return;
    }

    const lastChar = rawDigits.length > 0 ? rawDigits[rawDigits.length - 1] : '';
    input.value = lastChar;

    const currentDigits = [...this.digits()];
    currentDigits[index] = lastChar;
    this.digits.set(currentDigits);

    if (currentDigits.every((d) => !d)) {
      this.hasFailedAttempt.set(false);
    }

    if (this.submitState() === 'error') {
      this.submitState.set('idle');
      this.errorMessage.set('');
    }

    // Auto focus next box if a digit was entered
    if (lastChar && index < 3) {
      const inputsArray = this.otpInputs.toArray();
      const nextInput = inputsArray[index + 1]?.nativeElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }

    // Auto submit on last digit ONLY if fresh entry (no previous failed attempt)
    if (!this.hasFailedAttempt() && this.isCodeComplete()) {
      this.onSubmit();
    }
  }

  private handleMultiDigitInsert(rawDigits: string[], startIndex: number): void {
    const inputsArray = this.otpInputs.toArray();
    const currentDigits = [...this.digits()];

    if (rawDigits.length >= 4) {
      for (let i = 0; i < 4; i++) {
        currentDigits[i] = rawDigits[i];
      }
      this.digits.set(currentDigits);
      const targetInput = inputsArray[3]?.nativeElement;
      targetInput?.focus();
      targetInput?.select();
    } else {
      for (let i = 0; i < rawDigits.length; i++) {
        const targetIdx = startIndex + i;
        if (targetIdx < 4) {
          currentDigits[targetIdx] = rawDigits[i];
        }
      }
      this.digits.set(currentDigits);
      const nextIdx = Math.min(startIndex + rawDigits.length, 3);
      const targetInput = inputsArray[nextIdx]?.nativeElement;
      targetInput?.focus();
      targetInput?.select();
    }

    if (this.submitState() === 'error') {
      this.submitState.set('idle');
      this.errorMessage.set('');
    }

    if (!this.hasFailedAttempt() && this.isCodeComplete()) {
      this.onSubmit();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const inputsArray = this.otpInputs.toArray();

    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.isCodeComplete()) {
        this.onSubmit();
      }
      return;
    }

    // Input container uses dir="ltr" (Box 0 is left, Box 3 is right)
    // ArrowRight moves focus visually right (towards index + 1)
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < 3) {
        const nextInput = inputsArray[index + 1]?.nativeElement;
        nextInput?.focus();
        nextInput?.select();
      }
      return;
    }

    // ArrowLeft moves focus visually left (towards index - 1)
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) {
        const prevInput = inputsArray[index - 1]?.nativeElement;
        prevInput?.focus();
        prevInput?.select();
      }
      return;
    }

    if (event.key === 'Backspace') {
      if (!this.digits()[index] && index > 0) {
        event.preventDefault();
        const prevInput = inputsArray[index - 1]?.nativeElement;
        const currentDigits = [...this.digits()];
        currentDigits[index - 1] = '';
        this.digits.set(currentDigits);
        if (currentDigits.every((d) => !d)) {
          this.hasFailedAttempt.set(false);
        }
        prevInput?.focus();
        prevInput?.select();
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text') || '';
    const rawDigits = extractRawDigits(clipboardData);

    if (rawDigits.length === 0) return;

    const inputsArray = this.otpInputs.toArray();
    const targetElement = event.target as HTMLInputElement;
    let startIndex = inputsArray.findIndex(
      (ref) => ref.nativeElement === targetElement
    );
    if (startIndex === -1) {
      startIndex = 0;
    }

    this.handleMultiDigitInsert(rawDigits, startIndex);
  }

  onChangeMobileNumber(): void {
    this.router.navigate(['/login']);
  }

  onResendOtp(): void {
    if (this.countdown() > 0) return;

    this.submitState.set('loading');
    this.authService.resendOtp(this.mobileNumber()).subscribe({
      next: () => {
        this.submitState.set('idle');
        this.digits.set(['', '', '', '']);
        this.hasFailedAttempt.set(false);
        this.startCountdown();
        const inputsArray = this.otpInputs.toArray();
        const firstInput = inputsArray[0]?.nativeElement;
        firstInput?.focus();
        firstInput?.select();
      },
      error: () => {
        this.submitState.set('error');
        this.errorMessage.set('ارسال مجدد کد با خطا مواجه شد.');
      },
    });
  }

  onSubmit(): void {
    if (this.isSubmitDisabled()) return;

    this.submitState.set('loading');
    this.errorMessage.set('');

    this.authService.verifyOtp(this.mobileNumber(), this.fullCode()).subscribe({
      next: (res: OtpVerifyResponse) => {
        if (res.success) {
          this.submitState.set('success');
          setTimeout(() => {
            this.digits.set(['', '', '', '']);
            this.router.navigate(['/system-admin/dashboard']);
          }, 400);
        } else {
          this.hasFailedAttempt.set(true);
          this.submitState.set('error');
          this.errorMessage.set(res.message || 'کد وارد شده معتبر نیست.');
        }
      },
      error: () => {
        this.hasFailedAttempt.set(true);
        this.submitState.set('error');
        this.errorMessage.set('تایید کد با خطا مواجه شد. دوباره تلاش کنید.');
      },
    });
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdown.set(COUNTDOWN_SECONDS);
    this.timerRef = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        this.clearCountdown();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }
}
