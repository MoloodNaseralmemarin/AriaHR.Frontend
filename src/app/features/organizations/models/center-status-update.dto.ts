/**
 * `CenterStatusUpdateRequestDto` — body of `PATCH /api/centers/{centerId}/status`.
 */
export interface CenterStatusUpdateDto {
  isActive: boolean;
}
