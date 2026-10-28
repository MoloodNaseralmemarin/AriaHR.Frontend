import { LeaveRequestDto, LeaveType } from '../models/leave-request.model';
import { PersianDateService } from '../../../core/services/persian-date.service';

export interface CandidateLeaveRequest {
  id?: string;
  leaveType: LeaveType;
  startDate?: string | null;
  endDate?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface LeaveConflictResult {
  hasConflict: boolean;
  conflictMessage?: string;
  conflictingRequest?: LeaveRequestDto;
}

/**
 * Normalizes any Jalali or ISO date string to a standard YYYY-MM-DD Gregorian date string for comparisons.
 */
export function normalizeToGregorianDate(
  dateVal: string | null | undefined,
  persianDateService?: PersianDateService
): string | null {
  if (!dateVal) return null;
  const trimmed = dateVal.trim().split('T')[0];
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const year = parseInt(trimmed.substring(0, 4), 10);
    if (year >= 1900 && year <= 2100) {
      return trimmed;
    }
  }

  if (persianDateService) {
    const converted = persianDateService.toGregorianString(trimmed);
    if (converted) return converted;
  }

  return trimmed;
}

/**
 * Converts time string "HH:mm" or "HH:mm:ss" to total minutes from midnight.
 */
export function timeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Validates a candidate leave request against existing leave requests to detect duplicate or overlapping periods.
 */
export function findLeaveConflict(
  candidate: CandidateLeaveRequest,
  existingRequests: LeaveRequestDto[],
  excludeRequestId?: string,
  persianDateService?: PersianDateService
): LeaveConflictResult {
  if (!existingRequests || existingRequests.length === 0) {
    return { hasConflict: false };
  }

  // Filter existing requests: only consider Pending and Approved requests, exclude current request ID if provided
  const activeRequests = existingRequests.filter((req) => {
    if (!req) return false;
    const isPendingOrApproved = req.status === 'pending' || req.status === 'approved';
    const isExcluded = excludeRequestId && req.id === excludeRequestId;
    return isPendingOrApproved && !isExcluded;
  });

  if (activeRequests.length === 0) {
    return { hasConflict: false };
  }

  // Extract candidate dates and times
  const candidateType = candidate.leaveType;

  if (candidateType === 'daily') {
    const candStartGreg = normalizeToGregorianDate(candidate.startDate, persianDateService);
    const candEndGreg = normalizeToGregorianDate(candidate.endDate || candidate.startDate, persianDateService);

    if (!candStartGreg || !candEndGreg) {
      return { hasConflict: false };
    }

    for (const req of activeRequests) {
      const existType = req.leaveType;

      if (existType === 'daily') {
        const existStartGreg = normalizeToGregorianDate(req.startDate, persianDateService);
        const existEndGreg = normalizeToGregorianDate(req.endDate || req.startDate, persianDateService);

        if (!existStartGreg || !existEndGreg) continue;

        // Inclusive daily range overlap: [candStart, candEnd] overlaps [existStart, existEnd] if candStart <= existEnd && existStart <= candEnd
        if (candStartGreg <= existEndGreg && existStartGreg <= candEndGreg) {
          return {
            hasConflict: true,
            conflictingRequest: req,
            conflictMessage: formatConflictMessage(req, persianDateService),
          };
        }
      } else if (existType === 'hourly') {
        const existDateGreg = normalizeToGregorianDate(req.date || req.startDate, persianDateService);
        if (!existDateGreg) continue;

        // Candidate daily leave covers existDateGreg if candStart <= existDate && existDate <= candEnd
        if (candStartGreg <= existDateGreg && existDateGreg <= candEndGreg) {
          return {
            hasConflict: true,
            conflictingRequest: req,
            conflictMessage: formatConflictMessage(req, persianDateService),
          };
        }
      }
    }
  } else if (candidateType === 'hourly') {
    const candDateGreg = normalizeToGregorianDate(candidate.date || candidate.startDate, persianDateService);
    const candStartMin = timeToMinutes(candidate.startTime);
    const candEndMin = timeToMinutes(candidate.endTime);

    if (!candDateGreg || candStartMin === null || candEndMin === null || candEndMin <= candStartMin) {
      return { hasConflict: false };
    }

    for (const req of activeRequests) {
      const existType = req.leaveType;

      if (existType === 'daily') {
        const existStartGreg = normalizeToGregorianDate(req.startDate, persianDateService);
        const existEndGreg = normalizeToGregorianDate(req.endDate || req.startDate, persianDateService);

        if (!existStartGreg || !existEndGreg) continue;

        // Candidate hourly leave date falls inside daily leave range: existStart <= candDate && candDate <= existEnd
        if (existStartGreg <= candDateGreg && candDateGreg <= existEndGreg) {
          return {
            hasConflict: true,
            conflictingRequest: req,
            conflictMessage: formatConflictMessage(req, persianDateService),
          };
        }
      } else if (existType === 'hourly') {
        const existDateGreg = normalizeToGregorianDate(req.date || req.startDate, persianDateService);
        if (!existDateGreg || existDateGreg !== candDateGreg) continue;

        const existStartMin = timeToMinutes(req.startTime);
        const existEndMin = timeToMinutes(req.endTime);

        if (existStartMin === null || existEndMin === null || existEndMin <= existStartMin) continue;

        // Half-open interval overlap [candStart, candEnd) and [existStart, existEnd):
        // Overlap if candStart < existEnd && existStart < candEnd
        if (candStartMin < existEndMin && existStartMin < candEndMin) {
          return {
            hasConflict: true,
            conflictingRequest: req,
            conflictMessage: formatConflictMessage(req, persianDateService),
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Formats user-friendly Persian conflict message according to requirements:
 * Example daily: «برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است. (مرخصی روزانه در تاریخ ۱۴۰۵-۰۸-۰۹)»
 * Example hourly: «برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است. (مرخصی ساعتی از ۰۸:۰۰ تا ۱۲:۰۰ در تاریخ ۱۴۰۵-۰۸-۰۹)»
 */
export function formatConflictMessage(
  req: LeaveRequestDto,
  persianDateService?: PersianDateService
): string {
  const baseMessage = 'برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.';

  if (!req) return baseMessage;

  const leaveTypeLabel = req.leaveType === 'daily' ? 'مرخصی روزانه' : 'مرخصی ساعتی';

  if (req.leaveType === 'daily') {
    const rawStart = req.startDate;
    const rawEnd = req.endDate || req.startDate;

    let dateDisplay = '';
    if (rawStart) {
      const jalaliStart = persianDateService ? persianDateService.toJalaliString(rawStart) : rawStart;
      const jalaliEnd = rawEnd && rawEnd !== rawStart ? (persianDateService ? persianDateService.toJalaliString(rawEnd) : rawEnd) : jalaliStart;

      if (jalaliStart && jalaliEnd && jalaliStart !== jalaliEnd) {
        dateDisplay = `از تاریخ ${jalaliStart} تا ${jalaliEnd}`;
      } else if (jalaliStart) {
        dateDisplay = `در تاریخ ${jalaliStart}`;
      }
    }

    if (dateDisplay) {
      return `${baseMessage} (${leaveTypeLabel} ${dateDisplay})`;
    }
  } else if (req.leaveType === 'hourly') {
    const rawDate = req.date || req.startDate;
    const jalaliDate = rawDate ? (persianDateService ? persianDateService.toJalaliString(rawDate) : rawDate) : '';

    const sTime = req.startTime ? req.startTime.substring(0, 5) : '';
    const eTime = req.endTime ? req.endTime.substring(0, 5) : '';

    if (sTime && eTime && jalaliDate) {
      return `${baseMessage} (${leaveTypeLabel} از ${sTime} تا ${eTime} در تاریخ ${jalaliDate})`;
    } else if (jalaliDate) {
      return `${baseMessage} (${leaveTypeLabel} در تاریخ ${jalaliDate})`;
    }
  }

  return baseMessage;
}
