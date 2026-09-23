export interface CreateWorkLocationDto {
  organizationId: string;
  latitude: number;
  longitude: number;
  radiusInMeters: number;
  isActive: boolean;
}
