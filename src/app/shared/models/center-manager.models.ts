/**
 * Shared, framework-agnostic types used across the Center Manager UI.
 * This file has NO dependency on HTTP/services — it only describes shapes
 * used by mock data and components.
 */

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'onLeave' | 'pendingCheckIn';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type RequestType = 'leave' | 'attendanceCorrection' | 'shiftApproval';

export type NotificationType = 'shift' | 'request' | 'report' | 'system';

export type ShiftStatus = 'notStarted' | 'inProgress' | 'completed';

export interface Employee {
  id: string;
  fullName: string;
  role: string;
  mobile: string;
  status: 'active' | 'inactive';
  todayAttendance: AttendanceStatus;
  checkInTime?: string;
  avatarInitials: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  avatarInitials: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
}

export interface ShiftAssignment {
  id: string;
  startTime: string;
  endTime: string;
  plannedCount: number;
  presentCount: number;
  status: ShiftStatus;
  assignedEmployeeNames: string[];
  dateLabel: string;
}

export interface RequestItem {
  id: string;
  employeeName: string;
  avatarInitials: string;
  type: RequestType;
  typeLabel: string;
  dateLabel: string;
  description: string;
  status: RequestStatus;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  type: NotificationType;
  dateTimeLabel: string;
  isRead: boolean;
}

export interface DashboardSummary {
  activeEmployees: number;
  present: number;
  absent: number;
  pendingCheckIn: number;
}

export interface TodayAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
}

export interface ActionRequiredItem {
  id: string;
  label: string;
  count: number;
  actionLabel: string;
  icon: 'leave' | 'correction' | 'shift';
}
