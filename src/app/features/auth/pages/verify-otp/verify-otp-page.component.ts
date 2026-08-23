import {
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
import { normalizeMobileNumber } from '../../../../shared/utils/mobile-number.util';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const COUNTDOWN_SECONDS = 120;

@Component({
  selector: 'app-verify-otp-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp-page.component.html',
  styleUrl: './verify-otp-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpPageComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly mobileNumber = signal('09123456789');
  readonly digits = signal<string[]>(['', '', '', '']);
  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal('');
  readonly countdown = signal(COUNTDOWN_SECONDS);

  private timerRef: ReturnType<typeof setInterval> | null = null;

  readonly formattedCountdown = computed(() => {
    const total = this.countdown();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const padSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `0${minutes}:${padSec}`;
  });

  readonly fullCode = computed(() => this.digits().join(''));

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

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeMobileNumber(input.value);
    const lastChar = normalized.length > 0 ? normalized.slice(-1) : '';

    const currentDigits = [...this.digits()];
    currentDigits[index] = lastChar;
    this.digits.set(currentDigits);

    if (this.submitState() === 'error') {
      this.submitState.set('idle');
      this.errorMessage.set('');
    }

    // Auto focus next box
    if (lastChar && index < 3) {
      const inputsArray = this.otpInputs.toArray();
      inputsArray[index + 1]?.nativeElement.focus();
    }

    // Auto submit on last digit
    if (this.isCodeComplete()) {
      this.onSubmit();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const inputsArray = this.otpInputs.toArray();
      inputsArray[index - 1]?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text') || '';
    const normalized = normalizeMobileNumber(clipboardData).slice(0, 4);

    if (!normalized) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < normalized.length; i++) {
      newDigits[i] = normalized[i];
    }
    this.digits.set(newDigits);

    const targetIndex = Math.min(normalized.length, 3);
    const inputsArray = this.otpInputs.toArray();
    inputsArray[targetIndex]?.nativeElement.focus();

    if (this.isCodeComplete()) {
      this.onSubmit();
    }
  }

  onChangeMobileNumber(): void {
    this.router.navigate(['/login']);
  }

  onResendOtp(): void {
    if (this.countdown() > 0) return;

    this.submitState.set('loading');
    this.authService.resendOtp(this.mobileNumber()).subscribe({
      next: (res) => {
        this.submitState.set('idle');
        this.digits.set(['', '', '', '']);
        this.startCountdown();
        const inputsArray = this.otpInputs.toArray();
        inputsArray[0]?.nativeElement.focus();
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
        } else {
          this.submitState.set('error');
          this.errorMessage.set(res.message || 'کد وارد شده معتبر نیست.');
        }
      },
      error: () => {
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
