/**
 * `UpdateWorkLocationRequest` — body of `PUT /api/WorkLocations/work-locations/{id}`.
 *
 * The organization cannot be changed after creation.
 */
export interface UpdateWorkLocationDto {
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusInMeters: number;
  isActive: boolean;
}
