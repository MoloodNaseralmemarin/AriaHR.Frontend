export interface ShiftInfoDto {
  name: string;
  startTime: string;
  endTime: string;
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
