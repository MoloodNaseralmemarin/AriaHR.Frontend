import { QrCodeMode } from './create-work-location.dto';

/**
 * Mirrors `QrCodeResponse` in the backend. The property is `token` (a signed
 * value rendered into the QR image), not `code`.
 */
export interface QrCodeResponse {
  workLocationId: string;
  /** Backend enum name: "Static" | "Dynamic". */
  qrCodeMode: string;
  token: string;
  expiresAtUtc: string | null;
  refreshAfterUtc: string | null;
  generatedAtUtc: string;
  qrCodeEnabled: boolean;
  rotationIntervalMinutes: number;
}

/** Mirrors `QrCodeSettingsDto` in the backend. */
export interface QrCodeSettingsDto {
  workLocationId: string;
  qrCodeMode: string;
  qrCodeEnabled: boolean;
  rotationIntervalMinutes: number;
  minRotationIntervalMinutes: number;
  maxRotationIntervalMinutes: number;
  defaultRotationIntervalMinutes: number;
  lastGeneratedAtUtc: string | null;
  isDynamic: boolean;
}

/** Mirrors `UpdateQrCodeSettingsRequest` in the backend. */
export interface UpdateQrCodeSettingsDto {
  qrCodeMode: QrCodeMode;
  qrRotationIntervalMinutes?: number | null;
}
