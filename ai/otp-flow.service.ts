import { Injectable, signal } from '@angular/core';

/**
 * Carries the small bit of state that needs to survive the navigation from
 * /login to /verify-otp (the mobile number an OTP was just requested for).
 *
 * Deliberately not put in the URL: it's not something we want in browser
 * history / shareable links, and query params would make it trivial to land
 * on /verify-otp directly without ever requesting a code.
 *
 * Not a general-purpose store — if the auth flow grows more shared state
 * (e.g. OTP expiry returned by the API), extend this service rather than
 * reaching for a state-management library.
 */
@Injectable({ providedIn: 'root' })
export class OtpFlowService {
  private readonly _pendingMobileNumber = signal<string | null>(null);

  /**
   * One-shot signal: true only for the single navigation that follows a
   * successful OTP request. Lets /verify-otp show a "just sent" toast on
   * arrival without showing it again on refresh, back-navigation, or resend
   * (resend has its own inline confirmation). Read it via
   * `takeOtpJustSentFlag()`, which consumes it.
   */
  private readonly _otpJustSent = signal(false);

  /** The normalized mobile number ("09XXXXXXXXX") an OTP request is in flight or was sent for. */
  readonly pendingMobileNumber = this._pendingMobileNumber.asReadonly();

  setPendingMobileNumber(mobileNumber: string): void {
    this._pendingMobileNumber.set(mobileNumber);
  }

  /** Call right after a successful OTP request, before navigating to /verify-otp. */
  markOtpJustSent(): void {
    this._otpJustSent.set(true);
  }

  /** Reads and clears the flag in one step, so it can only ever fire once per request. */
  takeOtpJustSentFlag(): boolean {
    const value = this._otpJustSent();
    this._otpJustSent.set(false);
    return value;
  }

  /** Call once verification succeeds (or the user abandons the flow) so a stale number can't be reused. */
  clear(): void {
    this._pendingMobileNumber.set(null);
    this._otpJustSent.set(false);
  }
}
