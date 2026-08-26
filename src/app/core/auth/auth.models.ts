export interface SendOtpRequest {
  readonly phoneNumber: string;
}

export interface SendOtpResponse {
  readonly message: string;
  readonly otpCode?: string;
}

export interface OtpRequestResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly otpCode?: string;
}

export interface OtpVerifyResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly token?: string;
}
