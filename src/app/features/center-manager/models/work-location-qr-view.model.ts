import { QrCodeMode } from './qr-code-settings.dto';

/** Data needed by the QR modal, independent from the API response envelope. */
export interface WorkLocationQrView {
  code: string;
  expiresAtUtc: string | null;
  qrCodeMode: QrCodeMode;
}
