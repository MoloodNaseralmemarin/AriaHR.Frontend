/**
 * `QrCodeResponse` — a signed QR token for a work location.
 *
 * For a dynamic code the token is valid until `expiresAtUtc`; display clients
 * should request a fresh token at `refreshAfterUtc`. Static codes have no
 * expiration (`expiresAtUtc` is `null`).
 */
export interface QrCodeResponse {
  workLocationId: string;
  qrCodeMode: string;
  token: string;
  expiresAtUtc?: string | null;
  refreshAfterUtc?: string | null;
  generatedAtUtc: string;
  qrCodeEnabled: boolean;
  rotationIntervalMinutes: number;
}
