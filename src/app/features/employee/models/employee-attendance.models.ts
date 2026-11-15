/**
 * Attendance contracts mirroring the backend Attendance module
 * (`src/Modules/Attendance/Application/DTOs`).
 */

/** Mirrors `AttendanceRecordDto` returned by `GET /api/attendance/current`. */
export interface AttendanceRecordDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeFullName: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  checkInDistanceInMeters: number | null;
  checkOutDistanceInMeters: number | null;
  workLocationId: string | null;
  method: string;
  status: string;
  isWithinGeofence: boolean;
  createdAtUtc: string;
}

/** Mirrors `ScanAttendanceRequest` (`POST /api/attendance/scan`). */
export interface ScanAttendanceRequestDto {
  /** Signed token stored inside the work-location QR code. */
  qrCodeToken: string;
  latitude: number;
  longitude: number;
  gpsAccuracyInMeters: number | null;
  locationTimestampUtc: string;
  /** Optional: "CheckIn" | "CheckOut". The server decides when omitted. */
  attendanceAction?: 'CheckIn' | 'CheckOut';
  idempotencyKey?: string;
  deviceInfo?: string;
}

/** Mirrors `AttendanceScanData`. */
export interface AttendanceScanDataDto {
  attendanceId: string | null;
  workLocationId: string | null;
  workLocationName: string | null;
  attendanceAction: string | null;
  distanceInMeters: number | null;
  allowedRadiusInMeters: number | null;
  gpsAccuracyInMeters: number | null;
  registeredAtUtc: string | null;
  attendanceStatus: string | null;
  isLate: boolean | null;
  isEarlyDeparture: boolean | null;
  shiftName: string | null;
  isReplay: boolean;
}

/** Mirrors `AttendanceScanResponse` — the scan endpoint always answers in this envelope. */
export interface AttendanceScanResponseDto {
  success: boolean;
  code: string;
  message: string;
  data: AttendanceScanDataDto | null;
}

/** View model consumed by the attendance screen. */
export interface ShiftInfoDto {
  name: string;
  startTime: string;
  endTime: string;
}

export interface ActiveLeaveInfoDto {
  isHourly: boolean;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  leaveCategoryName?: string | null;
}

export interface TodayAttendanceDto {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workDuration?: string | null;
  shift?: ShiftInfoDto | null;
  status?: 'notCheckedIn' | 'checkedIn' | 'checkedOut' | string;
  workLocationName?: string | null;
  isAttendanceBlockedByLeave?: boolean;
  leaveRestrictionMessage?: string | null;
  activeLeave?: ActiveLeaveInfoDto | null;
}

/** Error codes returned by `POST /api/attendance/scan`. */
export type AttendanceErrorCode =
  | 'INVALID_REQUEST'
  | 'QR_CODE_INVALID'
  | 'QR_CODE_EXPIRED'
  | 'QR_CODE_DISABLED'
  | 'WORK_LOCATION_NOT_FOUND'
  | 'WORK_LOCATION_INACTIVE'
  | 'EMPLOYEE_NOT_FOUND'
  | 'EMPLOYEE_NOT_AUTHORIZED'
  | 'LOCATION_UNAVAILABLE'
  | 'LOCATION_COORDINATES_INVALID'
  | 'LOCATION_ACCURACY_INSUFFICIENT'
  | 'LOCATION_DATA_EXPIRED'
  | 'LOCATION_TIMESTAMP_INVALID'
  | 'OUTSIDE_ALLOWED_RADIUS'
  | 'SHIFT_VALIDATION_FAILED'
  | 'DUPLICATE_ATTENDANCE'
  | 'INVALID_ATTENDANCE_ACTION'
  | 'IDEMPOTENCY_KEY_REUSED';
