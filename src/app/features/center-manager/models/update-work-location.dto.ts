/**
 * Mirrors `UpdateWorkLocationRequest` in the backend
 * (`src/Modules/Organization/Application/DTOs/UpdateWorkLocationRequest.cs`).
 *
 * The update endpoint deliberately does not accept `organizationId` (the tenant
 * is fixed at creation) or QR settings (those live under `/qrcode/settings`).
 */
export interface UpdateWorkLocationDto {
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
}
