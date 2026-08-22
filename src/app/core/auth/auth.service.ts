import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface OtpRequestResponse {
  success: boolean;
  message?: string;
}

/**
 * Auth API surface for AriaHR.
 *
 * NOTE: `requestOtp` currently simulates the response so UI states can be tested independently.
 * Replace the simulated observable with an HttpClient call once the backend endpoint is ready.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  requestOtp(mobileNumber: string): Observable<OtpRequestResponse> {
    // Simulated backend call returning success after latency
    return of({ success: true, message: 'کد تایید با موفقیت ارسال شد.' }).pipe(
      delay(1400)
    );
  }
}
