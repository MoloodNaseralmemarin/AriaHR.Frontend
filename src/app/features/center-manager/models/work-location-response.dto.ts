export interface WorkLocationResponseDto {
  id?: string;
  organizationId?: string;
  latitude?: number;
  longitude?: number;
  radiusInMeters?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
