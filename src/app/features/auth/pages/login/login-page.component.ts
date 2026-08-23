import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, OtpRequestResponse } from '../../../../core/auth/auth.service';
import { isValidIranianMobile, normalizeMobileNumber } from '../../../../shared/utils/mobile-number.util';

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
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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

  onMobileInputChange(value: string): void {
    // Keep raw value bound; continuous normalization/validation occurs in computed signals
    this.mobileNumberInput.set(value);

    // Drop stale error state once the user edits input
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

    const mobile = this.normalizedMobileNumber();
    this.authService.requestOtp(mobile).subscribe({
      next: (res: OtpRequestResponse) => {
        if (res.success) {
          this.submitState.set('success');
          // Navigate to OTP verification page passing mobile number in state
          setTimeout(() => {
            this.router.navigate(['/verify-otp'], { state: { mobileNumber: mobile } });
          }, 400);
        } else {
          this.submitState.set('error');
        }
      },
      error: () => {
        this.submitState.set('error');
      },
    });
  }
}
