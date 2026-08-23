import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface OtpRequestResponse {
  success: boolean;
  message?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  message?: string;
  token?: string;
}

/**
 * Auth API surface for AriaHR.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Simulates requesting an OTP for a given mobile number. */
  requestOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    return of({ success: true, message: 'کد تایید با موفقیت ارسال شد.' }).pipe(
      delay(1200)
    );
  }

  /** Simulates verifying a 4-digit OTP code for a given mobile number. */
  verifyOtp(mobileNumber: string, code: string): Observable<OtpVerifyResponse> {
    // For demonstration, reject '0000' as invalid code, accept everything else
    if (code === '0000') {
      return of({ success: false, message: 'کد وارد شده نادرست است.' }).pipe(delay(1000));
    }

    return of({
      success: true,
      message: 'ورود با موفقیت انجام شد.',
      token: 'simulated-jwt-token-12345',
    }).pipe(delay(1200));
  }

  /** Simulates resending OTP code. */
  resendOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    return of({ success: true, message: 'کد مجدداً ارسال شد.' }).pipe(delay(1000));
  }
}
