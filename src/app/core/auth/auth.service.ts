import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, finalize } from 'rxjs/operators';

import { AuthApiService } from './auth-api.service';
import {
  AuthUserDto,
  CurrentUserDto,
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
const CURRENT_USER_KEY = 'aria_hr_current_user';

/**
 * Authentication service managing user state, tokens, and API communication.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApiService = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<AuthUserDto | null>(this.loadUserFromStorage());
  readonly userDetails = signal<CurrentUserDto | null>(this.loadCurrentUserFromStorage());
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
    const normalizedPhone = mobileNumber ? mobileNumber.trim() : '';

    if (!normalizedPhone) {
      return of({
        success: false,
        message: 'شماره موبایل وارد نشده است.',
      });
    }

    if (!/^\d{4}$/.test(normalizedCode)) {
      return of({
        success: false,
        message: 'کد تایید باید دقیقا ۴ رقم باشد.',
      });
    }

    return this.authApiService
      .verifyOtp({ phoneNumber: normalizedPhone, code: normalizedCode, otpCode: normalizedCode })
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

  /** Retrieves currently authenticated user profile from /api/auth/me and updates state. */
  getCurrentUser(): Observable<CurrentUserDto | null> {
    return this.authApiService.getCurrentUser().pipe(
      map((user: CurrentUserDto) => {
        this.userDetails.set(user);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        }
        return user;
      }),
      catchError((error) => {
        return of(null);
      })
    );
  }

  /** Clears authentication session locally and calls backend POST /api/auth/logout. */
  logout(): void {
    this.authApiService.logout().pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.clearLocalSession();
        if (this.router.url !== '/login') {
          this.router.navigate(['/login']);
        }
      })
    ).subscribe();
  }

  /** Clears token, user details and local storage keys synchronously. */
  clearLocalSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.userDetails.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
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

  private loadCurrentUserFromStorage(): CurrentUserDto | null {
    if (typeof localStorage === 'undefined') return null;
    const json = localStorage.getItem(CURRENT_USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as CurrentUserDto;
    } catch {
      return null;
    }
  }
}
