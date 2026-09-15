export interface CreateShiftDto {
  employeeId: string;
  shiftDate: string; // ISO date string, e.g. '2026-09-15'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  notes?: string;
}
