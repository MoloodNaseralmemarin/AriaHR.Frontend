/**
 * Mirrors `CreateWorkLocationRequest` in the backend
 * (`src/Modules/Organization/Application/DTOs/CreateWorkLocationRequest.cs`).
 *
 * The backend requires `name` and validates `allowedRadiusInMeters` against the
 * configured QrCode options (1..1000 metres by default). `organizationId` is
 * optional: the API always resolves the tenant from the caller's token and only
 * lets a SystemAdmin name a different organization explicitly.
 */
export interface CreateWorkLocationDto {
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
  /** 1 = Static, 2 = Dynamic (backend enum `QrCodeMode`). */
  qrCodeMode: QrCodeMode;
  qrCodeEnabled: boolean;
  /** Rotation interval for dynamic QR codes, in minutes (backend: 1..60). */
  qrRotationIntervalMinutes?: number | null;
  organizationId?: string;
}

export enum QrCodeMode {
  Static = 1,
  Dynamic = 2,
}

export const QR_CODE_MODE_LABELS: Record<QrCodeMode, string> = {
  [QrCodeMode.Static]: 'ثابت (Static)',
  [QrCodeMode.Dynamic]: 'پویا (Dynamic)',
};

/** Backend `QrCodeOptions` defaults, used for client-side validation messages. */
export const MIN_ROTATION_INTERVAL_MINUTES = 1;
export const MAX_ROTATION_INTERVAL_MINUTES = 60;
export const DEFAULT_ROTATION_INTERVAL_MINUTES = 5;
