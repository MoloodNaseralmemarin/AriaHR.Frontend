export interface CreateShiftDto {
  name: string; // e.g. 'شیفت صبح'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  isActive: boolean;
  organizationId: string;
}
