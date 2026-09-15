export interface ShiftResponseDto {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  notes?: string;
}
