import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface OtpRequestResponse {
  success: boolean;
  message?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  /** Auth/session token — shape depends on what the .NET API ends up returning. */
  token?: string;
  message?: string;
}

/**
 * Auth API surface for AriaHR.
 *
 * NOTE: none of these are implemented yet — the real implementation will
 * call the .NET 10 backend (e.g. POST /api/auth/otp/request,
 * POST /api/auth/otp/verify). The login and verify-otp pages currently
 * simulate these calls locally so the UI states (loading / success / error)
 * can be built and tested independently of the backend. Replace the method
 * bodies below with real HttpClient calls once the endpoints exist — the
 * pages consume these methods through their signatures, not their
 * implementation, so no component changes should be needed.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  requestOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    throw new Error(
      'AuthService.requestOtp() is not implemented yet. ' +
        'Connect this to the real .NET API endpoint when it is available.'
    );
  }

  /** Also used for "resend code" — same request, triggered again from the verify-otp page. */
  verifyOtp(mobileNumber: string, code: string): Observable<OtpVerifyResponse> {
    throw new Error(
      'AuthService.verifyOtp() is not implemented yet. ' +
        'Connect this to the real .NET API endpoint when it is available.'
    );
  }
}
