import { AttendanceStatus, RequestStatus, ShiftStatus } from '../models/center-manager.models';
import { BadgeTone } from '../components/status-badge/status-badge.component';

export const attendanceStatusMap: Record<AttendanceStatus, { label: string; tone: BadgeTone }> = {
  present: { label: 'حاضر', tone: 'success' },
  late: { label: 'تأخیر', tone: 'warning' },
  absent: { label: 'غایب', tone: 'danger' },
  onLeave: { label: 'مرخصی', tone: 'info' },
  pendingCheckIn: { label: 'در انتظار ورود', tone: 'neutral' },
};

export const requestStatusMap: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'در انتظار بررسی', tone: 'warning' },
  approved: { label: 'تأیید شده', tone: 'success' },
  rejected: { label: 'رد شده', tone: 'danger' },
};

export const shiftStatusMap: Record<ShiftStatus, { label: string; tone: BadgeTone }> = {
  notStarted: { label: 'شروع نشده', tone: 'neutral' },
  inProgress: { label: 'در حال انجام', tone: 'info' },
  completed: { label: 'پایان‌یافته', tone: 'success' },
};
