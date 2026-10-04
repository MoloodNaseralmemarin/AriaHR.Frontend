export type LeaveType = 'daily' | 'hourly';

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CreateLeaveRequestDto {
  leaveType: LeaveType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  date?: string;      // YYYY-MM-DD for hourly
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  reason?: string;
}

export interface LeaveRequestDto {
  id: string;
  leaveType: LeaveType;
  startDate?: string;
  endDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  durationText: string;
  reason?: string;
  status: LeaveRequestStatus;
  createdAt: string;
  managerComment?: string;
  rejectionReason?: string;
}

export interface LeaveSummaryDto {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}
