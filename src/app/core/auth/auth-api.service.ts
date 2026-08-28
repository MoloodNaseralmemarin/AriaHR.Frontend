import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CurrentUserDto,
  SendOtpDto,
  SendOtpResponseDto,
  VerifyOtpDto,
  VerifyOtpResponseDto,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Sends an OTP code to the specified phone number. */
  sendOtp(request: SendOtpDto): Observable<SendOtpResponseDto> {
    return this.http.post<SendOtpResponseDto>(
      `${this.baseUrl}/api/auth/send-otp`,
      request
    );
  }

  /** Verifies an OTP code for the specified phone number. */
  verifyOtp(request: VerifyOtpDto): Observable<VerifyOtpResponseDto> {
    const payload = {
      phoneNumber: request.phoneNumber,
      code: request.code ?? request.otpCode ?? '',
    };
    return this.http.post<VerifyOtpResponseDto>(
      `${this.baseUrl}/api/auth/verify-otp`,
      payload
    );
  }

  /** Retrieves the currently authenticated user details. */
  getCurrentUser(): Observable<CurrentUserDto> {
    return this.http.get<CurrentUserDto>(
      `${this.baseUrl}/api/auth/me`
    );
  }

  /** Sends a POST request to logout the currently authenticated session. */
  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/auth/logout`,
      {}
    );
  }
}
