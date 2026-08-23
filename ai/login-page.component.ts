import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { OtpFlowService } from '../../../core/services/otp-flow.service';
import { isValidIranianMobile, normalizeMobileNumber } from '../../../shared/utils/mobile-number.util';

/** The page's interaction state, kept explicit and mutually exclusive. */
type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly otpFlow = inject(OtpFlowService);

  /** Raw text bound to the input — may briefly contain Persian/Arabic digits as the user types. */
  readonly mobileNumberInput = signal('');

  /** Whether the field has been touched/blurred at least once (don't show errors before that). */
  readonly touched = signal(false);

  readonly submitState = signal<SubmitState>('idle');

  readonly normalizedMobileNumber = computed(() => normalizeMobileNumber(this.mobileNumberInput()));

  readonly isMobileValid = computed(() => isValidIranianMobile(this.normalizedMobileNumber()));

  readonly showValidationError = computed(() => this.touched() && !this.isMobileValid());

  readonly validationMessage = computed(() => {
    if (this.normalizedMobileNumber().length === 0) {
      return 'وارد کردن شماره موبایل الزامی است.';
    }
    return 'شماره موبایل وارد شده معتبر نیست.';
  });

  readonly isSubmitDisabled = computed(
    () => !this.isMobileValid() || this.submitState() === 'loading'
  );

  ngOnInit(): void {
    // If the user came back here via "ویرایش شماره موبایل" on the OTP page,
    // repopulate the field instead of making them retype it.
    const pending = this.otpFlow.pendingMobileNumber();
    if (pending) {
      this.mobileNumberInput.set(pending);
    }
  }

  onMobileInputChange(value: string): void {
    // Keep only digit-like characters as the user types; normalization/validation
    // happens continuously via the computed signals above.
    this.mobileNumberInput.set(value);

    // Once the user is actively correcting the field, drop any stale error state
    // so the message updates immediately instead of feeling stuck.
    if (this.submitState() === 'error') {
      this.submitState.set('idle');
    }
  }

  onBlur(): void {
    this.touched.set(true);
  }

  onSubmit(): void {
    if (this.isSubmitDisabled()) {
      return;
    }

    this.touched.set(true);
    this.submitState.set('loading');

    // TODO: replace this local simulation with a real call once the backend
    // OTP endpoint exists, e.g.:
    //
    //   this.authService.requestOtp(this.normalizedMobileNumber()).subscribe({
    //     next: () => this.onOtpRequestSucceeded(),
    //     error: () => this.submitState.set('error'),
    //   });
    //
    // The component's public surface (state signals, template bindings) is
    // already shaped for that swap — only this method body needs to change.
    this.simulateOtpRequest();
  }

  private simulateOtpRequest(): void {
    const SIMULATED_LATENCY_MS = 1400;
    setTimeout(() => {
      this.onOtpRequestSucceeded();
    }, SIMULATED_LATENCY_MS);
  }

  private onOtpRequestSucceeded(): void {
    this.submitState.set('success');
    this.otpFlow.setPendingMobileNumber(this.normalizedMobileNumber());

    // Briefly show the success message before moving on, so the confirmation
    // doesn't feel like it flashed past unnoticed.
    const SUCCESS_MESSAGE_DISPLAY_MS = 600;
    setTimeout(() => {
      this.router.navigate(['/verify-otp']);
    }, SUCCESS_MESSAGE_DISPLAY_MS);
  }
}
