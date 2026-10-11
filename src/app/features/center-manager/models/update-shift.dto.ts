export interface UpdateShiftDto {
  name: string;
  startTime: string; // 'HH:mm'
  endTime: string;   // 'HH:mm'
  isActive: boolean;
}
