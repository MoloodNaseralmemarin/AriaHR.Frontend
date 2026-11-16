/**
 * `UpdateBranchRequestDto` — body of `PUT /api/centers/{centerId}`.
 *
 * `name` and `code` are required; `email` is validated when supplied.
 */
export interface UpdateCenterDto {
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}
