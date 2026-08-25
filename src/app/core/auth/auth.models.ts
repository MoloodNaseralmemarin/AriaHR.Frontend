export interface SendOtpRequest {
  readonly phoneNumber: string;
}

export interface SendOtpResponse {
  readonly message: string;
  readonly otpCode?: string;
}

export interface VerifyOtpRequest {
  readonly phoneNumber: string;
  readonly otpCode: string;
}

export interface VerifyOtpResponse {
  readonly message?: string;
  readonly token?: string;
  readonly accessToken?: string;
  readonly success?: boolean;
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
