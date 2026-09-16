export interface CreateShiftDto {
  employeeId: string;
  shiftName: string; // e.g. 'شیفت صبح'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  notes?: string;
}
