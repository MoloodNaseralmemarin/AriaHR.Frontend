export interface CreateShiftDto {
  name: string; // e.g. 'شیفت صبح'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  isActive: boolean;
  /** Omitted by the client so the backend resolves it from the caller's token. */
  organizationId?: string;
}
