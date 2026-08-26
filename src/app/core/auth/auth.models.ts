/** Request DTO for sending an OTP code to a mobile number. */
export interface SendOtpDto {
  readonly phoneNumber: string;
}

/** Response DTO returned after requesting an OTP code. */
export interface SendOtpResponseDto {
  readonly message: string;
  readonly otpCode?: string;
}

/** Request DTO for verifying an OTP code. */
export interface VerifyOtpDto {
  readonly phoneNumber: string;
  readonly otpCode: string;
}

/** User information returned upon successful authentication. */
export interface AuthUserDto {
  readonly id?: string;
  readonly mobileNumber?: string;
  readonly fullName?: string;
  readonly roles?: string[];
  readonly permissions?: string[];
}

/** Response DTO returned after verifying an OTP code. */
export interface VerifyOtpResponseDto {
  readonly success?: boolean;
  readonly message?: string;
  readonly token?: string;
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly user?: AuthUserDto;
}

/** Legacy aliases for backward compatibility if needed across features. */
export type SendOtpRequest = SendOtpDto;
export type SendOtpResponse = SendOtpResponseDto;
export type VerifyOtpRequest = VerifyOtpDto;
export type VerifyOtpResponse = VerifyOtpResponseDto;
