import {
  ActionRequiredItem,
  AttendanceRecord,
  DashboardSummary,
  Employee,
  NotificationItem,
  RequestItem,
  ShiftAssignment,
  TodayAttendanceSummary,
} from '../models/center-manager.models';

/** ---------- Dashboard ---------- */

export const mockDashboardSummary: DashboardSummary = {
  activeEmployees: 12,
  present: 9,
  absent: 2,
  pendingCheckIn: 1,
};

export const mockTodayAttendanceSummary: TodayAttendanceSummary = {
  present: 9,
  late: 2,
  absent: 2,
  onLeave: 1,
};

export const mockActionRequiredItems: ActionRequiredItem[] = [
  { id: 'a1', label: 'درخواست مرخصی در انتظار تأیید', count: 2, actionLabel: 'بررسی', icon: 'leave' },
  { id: 'a2', label: 'درخواست اصلاح حضور', count: 1, actionLabel: 'بررسی', icon: 'correction' },
  { id: 'a3', label: 'شیفت بدون تأیید', count: 2, actionLabel: 'بررسی', icon: 'shift' },
];

export const mockTodayShifts: ShiftAssignment[] = [
  {
    id: 's1',
    startTime: '08:00',
    endTime: '16:00',
    plannedCount: 12,
    presentCount: 9,
    status: 'inProgress',
    assignedEmployeeNames: ['سارا احمدی', 'مریم رضایی', 'علی محمدی'],
    dateLabel: 'امروز',
  },
  {
    id: 's2',
    startTime: '16:00',
    endTime: '22:00',
    plannedCount: 5,
    presentCount: 0,
    status: 'notStarted',
    assignedEmployeeNames: ['رضا کریمی', 'نگار حسینی'],
    dateLabel: 'امروز',
  },
];

export const mockEmployeeStatusPreview: Employee[] = [
  { id: 'e1', fullName: 'سارا احمدی', role: 'پرستار', mobile: '0912xxxxxxx', status: 'active', todayAttendance: 'present', checkInTime: '07:58', avatarInitials: 'س‌ا' },
  { id: 'e2', fullName: 'مریم رضایی', role: 'پرستار', mobile: '0912xxxxxxx', status: 'active', todayAttendance: 'present', checkInTime: '08:02', avatarInitials: 'م‌ر' },
  { id: 'e3', fullName: 'علی محمدی', role: 'تکنسین', mobile: '0912xxxxxxx', status: 'active', todayAttendance: 'late', checkInTime: '08:27', avatarInitials: 'ع‌م' },
  { id: 'e4', fullName: 'رضا کریمی', role: 'مراقب', mobile: '0912xxxxxxx', status: 'active', todayAttendance: 'absent', avatarInitials: 'ر‌ک' },
];

export const mockDashboardNotifications: { id: string; text: string }[] = [
  { id: 'n1', text: 'برنامه شیفت هفته آینده منتشر شد' },
  { id: 'n2', text: '۳ درخواست جدید ثبت شده' },
  { id: 'n3', text: 'گزارش حضور ماه گذشته آماده است' },
];

/** ---------- Employees ---------- */

export const mockEmployees: Employee[] = [
  { id: 'e1', fullName: 'سارا احمدی', role: 'پرستار ارشد', mobile: '0912 345 6789', status: 'active', todayAttendance: 'present', checkInTime: '07:58', avatarInitials: 'س‌ا' },
  { id: 'e2', fullName: 'مریم رضایی', role: 'پرستار', mobile: '0912 111 2233', status: 'active', todayAttendance: 'present', checkInTime: '08:02', avatarInitials: 'م‌ر' },
  { id: 'e3', fullName: 'علی محمدی', role: 'تکنسین آزمایشگاه', mobile: '0935 220 1190', status: 'active', todayAttendance: 'late', checkInTime: '08:27', avatarInitials: 'ع‌م' },
  { id: 'e4', fullName: 'رضا کریمی', role: 'مراقب سالمند', mobile: '0919 887 4432', status: 'active', todayAttendance: 'absent', avatarInitials: 'ر‌ک' },
  { id: 'e5', fullName: 'نگار حسینی', role: 'پرستار', mobile: '0901 774 2201', status: 'active', todayAttendance: 'pendingCheckIn', avatarInitials: 'ن‌ح' },
  { id: 'e6', fullName: 'حسین طاهری', role: 'خدمات', mobile: '0937 452 8890', status: 'active', todayAttendance: 'onLeave', avatarInitials: 'ح‌ط' },
  { id: 'e7', fullName: 'زهرا نوری', role: 'منشی پذیرش', mobile: '0912 664 3321', status: 'active', todayAttendance: 'present', checkInTime: '07:50', avatarInitials: 'ز‌ن' },
  { id: 'e8', fullName: 'امیر صادقی', role: 'تکنسین', mobile: '0902 118 6654', status: 'inactive', todayAttendance: 'absent', avatarInitials: 'ا‌ص' },
];

/** ---------- Attendance ---------- */

export const mockAttendanceRecords: AttendanceRecord[] = [
  { id: 'r1', employeeId: 'e1', employeeName: 'سارا احمدی', role: 'پرستار ارشد', avatarInitials: 'س‌ا', checkIn: '07:58', checkOut: '16:05', status: 'present' },
  { id: 'r2', employeeId: 'e2', employeeName: 'مریم رضایی', role: 'پرستار', avatarInitials: 'م‌ر', checkIn: '08:02', checkOut: null, status: 'present' },
  { id: 'r3', employeeId: 'e3', employeeName: 'علی محمدی', role: 'تکنسین آزمایشگاه', avatarInitials: 'ع‌م', checkIn: '08:27', checkOut: null, status: 'late' },
  { id: 'r4', employeeId: 'e4', employeeName: 'رضا کریمی', role: 'مراقب سالمند', avatarInitials: 'ر‌ک', checkIn: null, checkOut: null, status: 'absent' },
  { id: 'r5', employeeId: 'e5', employeeName: 'نگار حسینی', role: 'پرستار', avatarInitials: 'ن‌ح', checkIn: null, checkOut: null, status: 'pendingCheckIn' },
  { id: 'r6', employeeId: 'e6', employeeName: 'حسین طاهری', role: 'خدمات', avatarInitials: 'ح‌ط', checkIn: null, checkOut: null, status: 'onLeave' },
  { id: 'r7', employeeId: 'e7', employeeName: 'زهرا نوری', role: 'منشی پذیرش', avatarInitials: 'ز‌ن', checkIn: '07:50', checkOut: '15:58', status: 'present' },
];

/** ---------- Shifts ---------- */

export const mockUpcomingShifts: ShiftAssignment[] = [
  { id: 'u1', startTime: '08:00', endTime: '16:00', plannedCount: 12, presentCount: 0, status: 'notStarted', assignedEmployeeNames: ['سارا احمدی', 'مریم رضایی'], dateLabel: 'فردا، سه‌شنبه' },
  { id: 'u2', startTime: '16:00', endTime: '22:00', plannedCount: 5, presentCount: 0, status: 'notStarted', assignedEmployeeNames: ['رضا کریمی', 'نگار حسینی'], dateLabel: 'فردا، سه‌شنبه' },
  { id: 'u3', startTime: '08:00', endTime: '16:00', plannedCount: 11, presentCount: 0, status: 'notStarted', assignedEmployeeNames: ['علی محمدی', 'زهرا نوری'], dateLabel: 'چهارشنبه' },
];

/** ---------- Requests ---------- */

export const mockRequests: RequestItem[] = [
  { id: 'q1', employeeName: 'مریم رضایی', avatarInitials: 'م‌ر', type: 'leave', typeLabel: 'درخواست مرخصی', dateLabel: '۱۴۰۳/۰۶/۰۴', description: 'مرخصی استعلاجی به مدت یک روز', status: 'pending' },
  { id: 'q2', employeeName: 'علی محمدی', avatarInitials: 'ع‌م', type: 'attendanceCorrection', typeLabel: 'اصلاح حضور', dateLabel: '۱۴۰۳/۰۶/۰۳', description: 'ثبت نشدن ورود به دلیل قطعی سیستم', status: 'pending' },
  { id: 'q3', employeeName: 'رضا کریمی', avatarInitials: 'ر‌ک', type: 'shiftApproval', typeLabel: 'تأیید شیفت', dateLabel: '۱۴۰۳/۰۶/۰۲', description: 'درخواست تعویض شیفت عصر با آقای طاهری', status: 'approved' },
  { id: 'q4', employeeName: 'نگار حسینی', avatarInitials: 'ن‌ح', type: 'leave', typeLabel: 'درخواست مرخصی', dateLabel: '۱۴۰۳/۰۵/۳۰', description: 'مرخصی روزانه جهت کار شخصی', status: 'rejected' },
  { id: 'q5', employeeName: 'زهرا نوری', avatarInitials: 'ز‌ن', type: 'attendanceCorrection', typeLabel: 'اصلاح حضور', dateLabel: '۱۴۰۳/۰۵/۲۹', description: 'فراموشی ثبت خروج', status: 'approved' },
];

/** ---------- Notifications ---------- */

export const mockNotifications: NotificationItem[] = [
  { id: 'nt1', title: 'برنامه شیفت هفته آینده منتشر شد', detail: 'برنامه شیفت‌های هفته آینده برای همه کارکنان قابل مشاهده است.', type: 'shift', dateTimeLabel: 'امروز، ۰۹:۱۰', isRead: false },
  { id: 'nt2', title: '۳ درخواست جدید ثبت شده', detail: 'سه درخواست جدید از کارکنان در انتظار بررسی شماست.', type: 'request', dateTimeLabel: 'امروز، ۰۸:۴۵', isRead: false },
  { id: 'nt3', title: 'گزارش حضور ماه گذشته آماده است', detail: 'گزارش کامل حضور و غیاب مرداد ماه قابل دانلود است.', type: 'report', dateTimeLabel: 'دیروز، ۱۸:۲۰', isRead: true },
  { id: 'nt4', title: 'به‌روزرسانی سامانه انجام شد', detail: 'نسخه جدید آریا اچ‌آر با بهبودهای عملکردی منتشر شد.', type: 'system', dateTimeLabel: '۲ روز پیش', isRead: true },
];
