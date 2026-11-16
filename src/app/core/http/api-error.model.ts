/**
 * ASP.NET Core ProblemDetails payload returned by the AriaHR backend for
 * business (400) and validation (400/422) failures.
 *
 * Example:
 * ```json
 * { "title": "خطای کسب و کار", "status": 400, "detail": "شرح دقیق خطا" }
 * ```
 */
export interface ProblemDetailsDto {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  errors?: Record<string, string[] | string> | null;
  /** Legacy envelope field still returned by a few endpoints. */
  message?: string | null;
}

/**
 * Normalized, end-user-safe view of an HTTP failure.
 *
 * `message` is always Persian, ready for a toast or an inline error banner.
 * `fieldErrors` keeps the raw backend messages (keyed by the backend field
 * name) so forms can attach them to their own controls.
 */
export interface ApiErrorInfo {
  /** HTTP status; 0 for network failures, -1 for non-HTTP errors. */
  status: number;
  title: string | null;
  detail: string | null;
  fieldErrors: Record<string, string>;
  message: string;
}
