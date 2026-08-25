import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

  /** Verifies a 4-digit OTP code for a given mobile number via AuthApiService. */
  verifyOtp(mobileNumber: string, code: string): Observable<OtpVerifyResponse> {
    const otpCodeStr = String(code).trim();
    return this.authApiService
      .verifyOtp({ phoneNumber: mobileNumber, otpCode: otpCodeStr })
      .pipe(
        map((res) => {
          const token = res.token || res.accessToken;
          return {
            success: true,
            message: res.message || 'ورود با موفقیت انجام شد.',
            token,
          };
        }),
        catchError((error) => {
          let errorMessage = 'کد وارد شده معتبر نیست.';
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

  /** Resends OTP code for a given mobile number. */
  resendOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    return this.requestOtp(mobileNumber);
  }
}
