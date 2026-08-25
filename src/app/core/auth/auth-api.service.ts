import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SendOtpRequest, SendOtpResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Sends an OTP to the given phone number using backend API endpoint. */
  sendOtp(request: SendOtpRequest): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(
      `${this.baseUrl}/api/auth/send-otp`,
      request
    );
  }
}
