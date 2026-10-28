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

export interface CreateLeaveRequestApiDto {
  leaveType: number;
  leaveCategoryId: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface LeaveRequestDto {
  id: string;
  leaveType: LeaveType;
  leaveCategoryId?: string;
  categoryName?: string;
  employeeName?: string;
  employeeFullName?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  durationText: string;
  reason?: string;
  status: LeaveRequestStatus;
  createdAt: string;
  approverName?: string;
  managerComment?: string;
  rejectionReason?: string;
}

export interface LeaveSummaryDto {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

/**
 * Detailed leave request response DTO returned from GET /api/requests/{id}
 */
export interface LeaveRequestDetailDto {
  id: string;
  employeeId: string;
  organizationId: string;
  leaveType: LeaveType; // Normalized 'daily' | 'hourly'
  leaveTypeRaw: number; // Raw enum number: 1 = hourly, 2 = daily
  leaveCategoryId: string | null;
  leaveCategoryName: string | null;
  employeeFirstName: string | null;
  employeeLastName: string | null;
  employeeFullName: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  status: LeaveRequestStatus; // Normalized 'pending' | 'approved' | 'rejected' | 'cancelled'
  statusRaw: number; // Raw enum number
  rejectedReason: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAtUtc: string;
}
