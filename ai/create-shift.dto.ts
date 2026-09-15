/**
 * Request contract for POST /api/shifts (or the actual Scheduling module
 * endpoint once confirmed against the backend).
 *
 * NOTE: field names/endpoint are NOT yet confirmed against a real backend
 * contract — the repo's AriaHR (.NET) side has a "Scheduling" module, but
 * its actual DTO shape was not inspected as part of this task. Adjust the
 * field names below to match the real Scheduling API contract before
 * wiring this up for real (see ARIAHR_ANGULAR_API_STANDARD.md §8: DTOs
 * must mirror the backend contract exactly, never invent field names).
 */
export interface CreateShiftDto {
  employeeId: string;
  shiftDate: string; // ISO date string, e.g. '2026-09-15'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  notes?: string;
}
