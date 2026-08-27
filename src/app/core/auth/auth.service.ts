import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthApiService } from './auth-api.service';
import {
  AuthUserDto,
  SendOtpResponseDto,
  VerifyOtpResponseDto,
} from './auth.models';

export interface OtpRequestResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly otpCode?: string;
}

export interface OtpVerifyResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly token?: string;
  readonly user?: AuthUserDto;
}

const TOKEN_KEY = 'aria_hr_access_token';
const REFRESH_TOKEN_KEY = 'aria_hr_refresh_token';
const USER_KEY = 'aria_hr_user';

/**
 * Authentication service managing user state, tokens, and API communication.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApiService = inject(AuthApiService);

  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<AuthUserDto | null>(this.loadUserFromStorage());
  readonly isAuthenticated = computed(() => !!this.token());

  /** Requests an OTP code for a given mobile number via AuthApiService. */
  requestOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    return this.authApiService.sendOtp({ phoneNumber: mobileNumber }).pipe(
      map((res: SendOtpResponseDto) => ({
        success: true,
        message: res.message || 'کد تایید با موفقیت ارسال شد.',
        otpCode: res.otpCode,
      })),
      catchError((error) => {
        let errorMessage = 'ارسال کد تایید با خطا مواجه شد.';
        if (error.error && typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        return of({
          success: false,
          message: errorMessage,
        });
      })
    );
  }

  /** Verifies an OTP code for a given mobile number via AuthApiService. */
  verifyOtp(mobileNumber: string, code: string): Observable<OtpVerifyResponse> {
    const normalizedCode = code ? code.trim() : '';

    return this.authApiService
      .verifyOtp({ phoneNumber: mobileNumber, otpCode: normalizedCode })
      .pipe(
        map((res: VerifyOtpResponseDto) => {
          const isSuccess = res.success !== false;
          const accessToken = res.token || res.accessToken;

          if (isSuccess && accessToken) {
            this.saveAuthentication(accessToken, res.refreshToken, res.user);
            return {
              success: true,
              message: res.message || 'ورود با موفقیت انجام شد.',
              token: accessToken,
              user: res.user,
            };
          }

          return {
            success: isSuccess && !!accessToken,
            message: res.message || (isSuccess ? 'ورود با موفقیت انجام شد.' : 'کد وارد شده معتبر نیست.'),
            token: accessToken,
            user: res.user,
          };
        }),
        catchError((error) => {
          let errorMessage = 'تایید کد با خطا مواجه شد. دوباره تلاش کنید.';
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

  /** Resends OTP code. */
  resendOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    return this.requestOtp(mobileNumber);
  }

  /** Saves token and user info in state and persistent storage. */
  saveAuthentication(token: string, refreshToken?: string, user?: AuthUserDto): void {
    this.token.set(token);
    localStorage.setItem(TOKEN_KEY, token);

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (user) {
      this.currentUser.set(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  /** Clears authentication session. */
  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUserFromStorage(): AuthUserDto | null {
    if (typeof localStorage === 'undefined') return null;
    const json = localStorage.getItem(USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as AuthUserDto;
    } catch {
      return null;
    }
  }
}
