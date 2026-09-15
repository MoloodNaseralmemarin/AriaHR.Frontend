/**
 * Response contract returned after creating/fetching a shift.
 * Same caveat as create-shift.dto.ts: field names are a placeholder until
 * confirmed against the real Scheduling module contract.
 */
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
