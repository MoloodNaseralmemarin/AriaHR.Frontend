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

  /** The normalized mobile number ("09XXXXXXXXX") an OTP request is in flight or was sent for. */
  readonly pendingMobileNumber = this._pendingMobileNumber.asReadonly();

  setPendingMobileNumber(mobileNumber: string): void {
    this._pendingMobileNumber.set(mobileNumber);
  }

  /** Call once verification succeeds (or the user abandons the flow) so a stale number can't be reused. */
  clear(): void {
    this._pendingMobileNumber.set(null);
  }
}
