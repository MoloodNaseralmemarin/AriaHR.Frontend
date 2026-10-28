export interface ShiftInfoDto {
  name: string;
  startTime: string;
  endTime: string;
}

export interface ActiveLeaveInfoDto {
  id: string;
  leaveType: 'daily' | 'hourly';
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  categoryName?: string;
  countdownEndTimeUtc?: string | null;
  isEffectiveToday: boolean;
  isCurrentlyActive: boolean;
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
  activeLeave?: ActiveLeaveInfoDto | null;
  isAttendanceBlockedByLeave?: boolean;
  leaveRestrictionMessage?: string | null;
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
}
