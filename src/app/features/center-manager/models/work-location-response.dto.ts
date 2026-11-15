/**
 * Response of the work-location endpoints. Mirrors `WorkLocationDto` in the
 * backend (`src/Modules/Organization/Application/UseCases/CreateWorkLocation/WorkLocationDtoMapper.cs`).
 */
export interface WorkLocationDto {
  id: string;
  organizationId: string;
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
  /** Backend enum name: "Static" | "Dynamic". */
  qrCodeMode: string;
  qrCodeEnabled: boolean;
  qrRotationIntervalMinutes: number | null;
  qrCodeLastGeneratedAtUtc: string | null;
  createdAtUtc: string;
  createdByUserId: string | null;
  updatedAtUtc: string | null;
  updatedByUserId: string | null;
}

/** @deprecated Use {@link WorkLocationDto}. Kept as an alias for existing imports. */
export type WorkLocationResponseDto = WorkLocationDto;

/** Response of Neshan Reverse Geocoding v5 (https://api.neshan.org/v5/reverse). */
export interface NeshanReverseGeocodeResponse {
  status?: string;
  formatted_address?: string;
  address?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
  district?: string;
  county?: string;
  region?: string;
  municipality_zone?: string;
  route_name?: string;
  route_type?: string;
  place?: string;
}
