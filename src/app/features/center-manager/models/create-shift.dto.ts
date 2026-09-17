export interface CreateShiftDto {
  employeeId: string;
  shiftName: string; // ISO date string, e.g. '2026-09-15'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  notes?: string;
}
