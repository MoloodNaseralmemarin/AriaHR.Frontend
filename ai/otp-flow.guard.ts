import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OtpFlowService } from '../services/otp-flow.service';

/**
 * Keeps /verify-otp reachable only as the second step of the flow.
 *
 * Without this, a user could open /verify-otp directly (bookmark, back
 * button after clearing state, shared link) and land on a page with no
 * mobile number to show or verify against.
 */
export const otpFlowGuard: CanActivateFn = () => {
  const otpFlow = inject(OtpFlowService);
  const router = inject(Router);

  if (otpFlow.pendingMobileNumber()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
