export interface ShiftDto {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  organizationId?: string;
}
