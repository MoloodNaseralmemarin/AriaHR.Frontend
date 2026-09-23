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

export interface NeshanReverseGeocodeResponse {
  status?: string;
  formatted_address?: string;
  address?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
}
