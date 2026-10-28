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

export interface RegisterAttendanceDto {
  qrCode: string;
  latitude: number;
  longitude: number;
}

export interface RegisterAttendanceResponseDto {
  success: boolean;
  operationType?: 'checkIn' | 'checkOut' | string;
  attendanceStatus?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workLocationName?: string | null;
  message?: string | null;
  errorCode?: string | null;
}
