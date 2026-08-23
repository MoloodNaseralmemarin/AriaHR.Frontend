import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { OtpFlowService } from '../../../core/services/otp-flow.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 60;

/** Masks an 11-digit "09XXXXXXXXX" number as "0912***6789" for display. */
function maskMobileNumber(mobileNumber: string): string {
  if (mobileNumber.length !== 11) {
    return mobileNumber;
  }
  return `${mobileNumber.slice(0, 4)}***${mobileNumber.slice(7)}`;
}

@Component({
  selector: 'app-verify-otp-page',
  standalone: true,
  imports: [],
  templateUrl: './verify-otp-page.component.html',
  styleUrl: './verify-otp-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpPageComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly otpFlow = inject(OtpFlowService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChildren('digitInput') private digitInputs?: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpLength = OTP_LENGTH;

  readonly digits = signal<string[]>(Array(OTP_LENGTH).fill(''));
  readonly code = computed(() => this.digits().join(''));
  readonly isComplete = computed(() => this.code().length === OTP_LENGTH);

  readonly submitState = signal<SubmitState>('idle');
  readonly resendJustSent = signal(false);
  readonly resendCooldown = signal(RESEND_COOLDOWN_SECONDS);
  readonly canResend = computed(() => this.resendCooldown() === 0 && this.submitState() !== 'loading');

  readonly mobileNumber = this.otpFlow.pendingMobileNumber;
  readonly maskedMobileNumber = computed(() => maskMobileNumber(this.mobileNumber() ?? ''));

  private cooldownIntervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.startResendCooldown();
    this.destroyRef.onDestroy(() => {
      if (this.cooldownIntervalId !== undefined) {
        clearInterval(this.cooldownIntervalId);
      }
    });
  }

  ngAfterViewInit(): void {
    this.focusDigitAt(0);
  }

  onDigitInput(index: number, rawValue: string): void {
    // Keep only the last typed character and only if it's a digit.
    const digit = rawValue.replace(/\D/g, '').slice(-1);

    this.setDigit(index, digit);

    if (this.submitState() === 'error') {
      this.submitState.set('idle');
    }

    if (digit && index < OTP_LENGTH - 1) {
      this.focusDigitAt(index + 1);
    }

    if (this.isComplete()) {
      this.verify();
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      event.preventDefault();
      this.setDigit(index - 1, '');
      this.focusDigitAt(index - 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digitsOnly) {
      return;
    }

    event.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < digitsOnly.length; i++) {
      next[i] = digitsOnly[i];
    }
    this.digits.set(next);

    const lastFilledIndex = Math.min(digitsOnly.length, OTP_LENGTH) - 1;
    this.focusDigitAt(lastFilledIndex);

    if (this.isComplete()) {
      this.verify();
    }
  }

  onManualSubmit(): void {
    if (!this.isComplete() || this.submitState() === 'loading') {
      return;
    }
    this.verify();
  }

  onResend(): void {
    if (!this.canResend()) {
      return;
    }

    this.digits.set(Array(OTP_LENGTH).fill(''));
    this.submitState.set('idle');
    this.focusDigitAt(0);
    this.startResendCooldown();

    // TODO: call the real resend endpoint once available, e.g.:
    //   this.authService.requestOtp(this.mobileNumber()!).subscribe(...)
    this.resendJustSent.set(true);
    setTimeout(() => this.resendJustSent.set(false), 2500);
  }

  onEditNumber(): void {
    // Deliberately not clearing OtpFlowService here — the login page reads
    // the pending number back out to prefill the field for the user.
    this.router.navigate(['/login']);
  }

  private verify(): void {
    this.submitState.set('loading');

    // TODO: replace this local simulation with a real call once the backend
    // OTP endpoint exists, e.g.:
    //
    //   this.authService.verifyOtp(this.mobileNumber()!, this.code()).subscribe({
    //     next: () => this.onVerifySucceeded(),
    //     error: () => this.onVerifyFailed(),
    //   });
    //
    // Demo convenience only: "0000" simulates a failed verification so the
    // error state is reachable without a backend. Remove once real API is wired.
    const SIMULATED_LATENCY_MS = 1000;
    setTimeout(() => {
      if (this.code() === '0000') {
        this.onVerifyFailed();
      } else {
        this.onVerifySucceeded();
      }
    }, SIMULATED_LATENCY_MS);
  }

  private onVerifySucceeded(): void {
    this.submitState.set('success');
    const SUCCESS_MESSAGE_DISPLAY_MS = 500;
    setTimeout(() => {
      this.otpFlow.clear();
      this.router.navigate(['/dashboard']);
    }, SUCCESS_MESSAGE_DISPLAY_MS);
  }

  private onVerifyFailed(): void {
    this.submitState.set('error');
    this.digits.set(Array(OTP_LENGTH).fill(''));
    this.focusDigitAt(0);
  }

  private setDigit(index: number, value: string): void {
    const next = [...this.digits()];
    next[index] = value;
    this.digits.set(next);
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(RESEND_COOLDOWN_SECONDS);
    if (this.cooldownIntervalId !== undefined) {
      clearInterval(this.cooldownIntervalId);
    }
    this.cooldownIntervalId = setInterval(() => {
      const next = this.resendCooldown() - 1;
      if (next <= 0) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownIntervalId);
      } else {
        this.resendCooldown.set(next);
      }
    }, 1000);
  }

  private focusDigitAt(index: number): void {
    // Deferred so it runs after change detection has applied the DOM update
    // that triggered it (e.g. a digit being cleared before we refocus it).
    setTimeout(() => {
      this.digitInputs?.get(index)?.nativeElement.focus();
    });
  }
}
