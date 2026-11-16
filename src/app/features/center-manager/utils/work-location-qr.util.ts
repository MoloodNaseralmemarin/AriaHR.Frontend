import { QrCodeMode } from '../models/qr-code-settings.dto';

/** The backend serializes the QR mode as `Static` or `Dynamic`. */
export function normalizeQrMode(value: string | null | undefined): QrCodeMode {
  return value === 'Dynamic' ? 'Dynamic' : 'Static';
}

export function qrModeLabel(value: string | null | undefined): string {
  return normalizeQrMode(value) === 'Dynamic' ? 'پویا' : 'ثابت';
}

export function qrModeDescription(value: string | null | undefined): string {
  return normalizeQrMode(value) === 'Dynamic'
    ? 'کد در بازه‌های زمانی مشخص منقضی و تازه می‌شود.'
    : 'کد ثابت است و تاریخ انقضا ندارد.';
}

export function qrModeIsDynamic(value: string | null | undefined): boolean {
  return normalizeQrMode(value) === 'Dynamic';
}
