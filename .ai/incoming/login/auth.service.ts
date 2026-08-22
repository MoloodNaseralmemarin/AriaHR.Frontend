import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface OtpRequestResponse {
  success: boolean;
  message?: string;
}

/**
 * Auth API surface for AriaHR.
 *
 * NOTE: `requestOtp` is intentionally NOT implemented yet — the real
 * implementation will call the .NET 10 backend (e.g. POST /api/auth/otp/request).
 * The login page currently simulates this call locally so the UI states
 * (loading / success / error) can be built and tested independently of the
 * backend. Replace the body below with an HttpClient call once the endpoint
 * is ready, and the component will not need to change.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  requestOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    throw new Error(
      'AuthService.requestOtp() is not implemented yet. ' +
        'Connect this to the real .NET API endpoint when it is available.'
    );
  }
}
