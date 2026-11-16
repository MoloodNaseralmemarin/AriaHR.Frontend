import { BadgeTone } from '../components/status-badge/status-badge.component';

export interface AttendanceStatusMeta {
  label: string;
  tone: BadgeTone;
}

/**
 * Display metadata for the attendance statuses stored by the backend.
 *
 * The backend persists `Present` on check-in, `Completed` on check-out,
 * `Approved` (or any custom status) through the manager correction endpoint,
 * so unknown values are shown verbatim instead of being hidden.
 */
const STATUS_META: Readonly<Record<string, AttendanceStatusMeta>> = {
  present: { label: 'حاضر', tone: 'success' },
  completed: { label: 'پایان‌یافته', tone: 'info' },
  approved: { label: 'تأییدشده', tone: 'success' },
  late: { label: 'تأخیر', tone: 'warning' },
  absent: { label: 'غایب', tone: 'danger' },
  onleave: { label: 'در مرخصی', tone: 'info' },
  pending: { label: 'در انتظار بررسی', tone: 'neutral' },
  pendingcheckin: { label: 'در انتظار ورود', tone: 'neutral' },
};

/** Statuses a manager may set through `PATCH /api/attendance/{id}/status`. */
export const ATTENDANCE_CORRECTION_STATUSES: readonly string[] = [
  'Present',
  'Late',
  'Absent',
  'Approved',
  'Completed',
];

export function getAttendanceStatusMeta(status: string | null | undefined): AttendanceStatusMeta {
  if (!status || !status.trim()) {
    return { label: 'ثبت نشده', tone: 'neutral' };
  }

  const key = status.replace(/[\s_-]/g, '').toLowerCase();
  const known = STATUS_META[key];
  if (known) {
    return known;
  }

  return { label: status, tone: 'neutral' };
}

/** True when the record has an open check-in (employee is currently at work). */
export function isOpenAttendance(record: { checkOutTime?: string | null } | null | undefined): boolean {
  return !!record && !record.checkOutTime;
}

/** `HH:mm` of an ISO timestamp in the browser's local timezone, or `—`. */
export function formatAttendanceTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Worked duration between check-in and check-out as Persian digits, or `—`. */
export function formatWorkDuration(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined
): string {
  if (!checkIn || !checkOut) {
    return '—';
  }

  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return '—';
  }

  const totalMinutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} ساعت`);
  }
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} دقیقه`);
  }

  return parts.join(' و ');
}

/** Local `yyyy-MM-dd` used by the backend `DateOnly` query parameters. */
export function toApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local `HH:mm` for `<input type="time">` values. */
export function toTimeInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
