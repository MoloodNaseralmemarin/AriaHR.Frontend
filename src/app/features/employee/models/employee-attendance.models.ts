/**
 * Attendance API contracts.
 *
 * These interfaces mirror the ASP.NET Core DTOs of the Attendance module
 * (`src/Modules/Attendance/Application/DTOs`) exactly. The status set is open:
 * check-in stores `Present`, check-out stores `Completed`, a manager can set a
 * custom status through `PATCH /api/attendance/{id}/status`, so the type is a
 * known-value union widened with `string`.
 */
export type AttendanceRecordStatus = 'Present' | 'Completed' | 'Approved' | (string & {});

/** Explicit scan action; when omitted the API decides from the active record. */
export type AttendanceAction = 'CheckIn' | 'CheckOut';

/** `AttendanceRecordDto` returned by check-in, check-out, history and status endpoints. */
export interface AttendanceRecordDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeFullName?: string | null;
  /** UTC timestamp of the check-in. */
  checkInTime: string;
  checkOutTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkInAccuracy?: number | null;
  checkOutAccuracy?: number | null;
  checkInDistanceInMeters?: number | null;
  checkOutDistanceInMeters?: number | null;
  checkInLocationTimestampUtc?: string | null;
  checkOutLocationTimestampUtc?: string | null;
  workLocationId?: string | null;
  qrCodeId?: string | null;
  method: string;
  status: AttendanceRecordStatus;
  isWithinGeofence: boolean;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  notes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAtUtc: string;
}

/** Body of `POST /api/attendance/scan` (`ScanAttendanceRequest`). */
export interface ScanAttendanceRequestDto {
  qrCodeToken: string;
  latitude: number;
  longitude: number;
  /** Required by the server; readings that are too imprecise are rejected. */
  gpsAccuracyInMeters: number;
  /** Required by the server; stale readings are rejected. */
  locationTimestampUtc: string;
  attendanceAction?: AttendanceAction;
  /** Replay protection: the same key never registers a second record. */
  idempotencyKey?: string;
  deviceInfo?: string;
  notes?: string;
}

/** `AttendanceScanData` embedded in the scan response. */
export interface AttendanceScanDataDto {
  attendanceId?: string | null;
  workLocationId?: string | null;
  workLocationName?: string | null;
  attendanceAction?: AttendanceAction | string | null;
  distanceInMeters?: number | null;
  allowedRadiusInMeters?: number | null;
  gpsAccuracyInMeters?: number | null;
  registeredAtUtc?: string | null;
  attendanceStatus?: string | null;
  isLate?: boolean | null;
  isEarlyDeparture?: boolean | null;
  shiftName?: string | null;
  isReplay: boolean;
}

/** `AttendanceScanResponse` envelope; errors carry a stable `code`. */
export interface AttendanceScanResponseDto {
  success: boolean;
  code: string;
  message: string;
  data?: AttendanceScanDataDto | null;
}

/** Body of `POST /api/attendance/check-in` (`CheckInRequest`). */
export interface CheckInRequestDto {
  method: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  workLocationId?: string | null;
  qrCodeToken?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  notes?: string | null;
}

/** Body of `POST /api/attendance/check-out` (`CheckOutRequest`). */
export interface CheckOutRequestDto {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  notes?: string | null;
}

/** Body of `PATCH /api/attendance/{id}/status` (`UpdateAttendanceStatusRequest`). */
export interface UpdateAttendanceStatusRequestDto {
  status: string;
  notes?: string | null;
}

/** Query of `GET /api/attendance/my` and `GET /api/attendance`. Dates are `yyyy-MM-dd`. */
export interface AttendanceDateRangeQuery {
  startDate?: string;
  endDate?: string;
}

/** Query of `GET /api/attendance` (CenterManager / SystemAdmin only). */
export interface OrganizationAttendanceQuery extends AttendanceDateRangeQuery {
  organizationId?: string;
  employeeId?: string;
}
