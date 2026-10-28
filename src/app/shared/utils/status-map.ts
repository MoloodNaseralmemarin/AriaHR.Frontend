import { AttendanceStatus, ShiftStatus } from '../models/center-manager.models';
import { BadgeTone } from '../components/status-badge/status-badge.component';

export const attendanceStatusMap: Record<AttendanceStatus, { label: string; tone: BadgeTone }> = {
  present: { label: 'حاضر', tone: 'success' },
  late: { label: 'تأخیر', tone: 'warning' },
  absent: { label: 'غایب', tone: 'danger' },
  onLeave: { label: 'در مرخصی', tone: 'info' },
  pendingCheckIn: { label: 'در انتظار ورود', tone: 'neutral' },
};

export const shiftStatusMap: Record<ShiftStatus, { label: string; tone: BadgeTone }> = {
  notStarted: { label: 'شروع نشده', tone: 'neutral' },
  inProgress: { label: 'در حال انجام', tone: 'info' },
  completed: { label: 'پایان‌یافته', tone: 'success' },
};
