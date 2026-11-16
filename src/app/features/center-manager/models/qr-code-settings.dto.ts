/**
 * `QrCodeSettingsDto` — response of `GET|PUT /api/organizations/work-locations/{id}/qrcode/settings`.
 */
export interface QrCodeSettingsDto {
  workLocationId: string;
  qrCodeMode: string;
  qrCodeEnabled: boolean;
  rotationIntervalMinutes: number;
  minRotationIntervalMinutes: number;
  maxRotationIntervalMinutes: number;
  defaultRotationIntervalMinutes: number;
  lastGeneratedAtUtc?: string | null;
  isDynamic: boolean;
}

/**
 * `UpdateQrCodeSettingsRequest` — body of the QR settings PUT.
 * `qrCodeMode` is `Static` or `Dynamic`; the rotation interval only applies to dynamic codes.
 */
export interface UpdateQrCodeSettingsDto {
  qrCodeMode: string;
  qrRotationIntervalMinutes?: number | null;
}
