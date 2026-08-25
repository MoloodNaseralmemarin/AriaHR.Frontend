import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { AuthApiService } from './auth-api.service';
import { OtpRequestResponse, OtpVerifyResponse } from './auth.models';

export type { OtpRequestResponse, OtpVerifyResponse } from './auth.models';

/**
 * Auth application service for AriaHR.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApiService = inject(AuthApiService);

  /** Requests an OTP for a given mobile number via AuthApiService. */
  requestOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    return this.authApiService.sendOtp({ phoneNumber: mobileNumber }).pipe(
      map((res) => ({
        success: true,
        message: res.message,
        otpCode: res.otpCode,
      })),
      catchError((error) => {
        let errorMessage = 'ارسال کد تایید با خطا مواجه شد.';
        if (error.error && typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        }
        return of({
          success: false,
          message: errorMessage,
        });
      })
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
    return this.requestOtp(mobileNumber);
  }
}
