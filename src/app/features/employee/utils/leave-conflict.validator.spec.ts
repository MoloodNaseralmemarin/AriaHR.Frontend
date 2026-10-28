import { describe, it, expect } from 'vitest';
import {
  findLeaveConflict,
  formatConflictMessage,
  normalizeToGregorianDate,
  timeToMinutes,
} from './leave-conflict.validator';
import { LeaveRequestDto } from '../models/leave-request.model';

describe('LeaveConflictValidator', () => {
  const existingRequests: LeaveRequestDto[] = [
    {
      id: 'req-1',
      leaveType: 'daily',
      startDate: '2026-10-30', // 1405-08-08
      endDate: '2026-10-31',   // 1405-08-09
      status: 'approved',
      durationText: '2 روز',
      createdAt: '2026-10-01',
    },
    {
      id: 'req-2',
      leaveType: 'hourly',
      date: '2026-11-02',      // 1405-08-11
      startTime: '08:00',
      endTime: '12:00',
      status: 'pending',
      durationText: '4 ساعت',
      createdAt: '2026-10-01',
    },
    {
      id: 'req-3',
      leaveType: 'daily',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      status: 'rejected',
      durationText: '1 روز',
      createdAt: '2026-10-01',
    },
    {
      id: 'req-4',
      leaveType: 'hourly',
      date: '2026-11-06',
      startTime: '10:00',
      endTime: '12:00',
      status: 'cancelled',
      durationText: '2 ساعت',
      createdAt: '2026-10-01',
    },
  ];

  it('1. detects duplicate daily leave on the same date', () => {
    const result = findLeaveConflict(
      { leaveType: 'daily', startDate: '2026-10-30', endDate: '2026-10-30' },
      existingRequests
    );
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingRequest?.id).toBe('req-1');
  });

  it('2. detects overlapping daily leave date ranges', () => {
    const result = findLeaveConflict(
      { leaveType: 'daily', startDate: '2026-10-31', endDate: '2026-11-01' },
      existingRequests
    );
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingRequest?.id).toBe('req-1');
  });

  it('3. detects overlapping hourly leave intervals', () => {
    const result = findLeaveConflict(
      { leaveType: 'hourly', date: '2026-11-02', startTime: '10:00', endTime: '14:00' },
      existingRequests
    );
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingRequest?.id).toBe('req-2');
  });

  it('4. allows non-overlapping hourly leave intervals (half-open [startTime, endTime))', () => {
    // 06:00 to 08:00 touches 08:00
    const result1 = findLeaveConflict(
      { leaveType: 'hourly', date: '2026-11-02', startTime: '06:00', endTime: '08:00' },
      existingRequests
    );
    expect(result1.hasConflict).toBe(false);

    // 12:00 to 14:00 touches 12:00
    const result2 = findLeaveConflict(
      { leaveType: 'hourly', date: '2026-11-02', startTime: '12:00', endTime: '14:00' },
      existingRequests
    );
    expect(result2.hasConflict).toBe(false);
  });

  it('5. detects daily leave conflicting with hourly leave on the same date', () => {
    // Daily candidate on same date as hourly existing request
    const dailyCand = findLeaveConflict(
      { leaveType: 'daily', startDate: '2026-11-02', endDate: '2026-11-02' },
      existingRequests
    );
    expect(dailyCand.hasConflict).toBe(true);
    expect(dailyCand.conflictingRequest?.id).toBe('req-2');

    // Hourly candidate on date within daily existing request
    const hourlyCand = findLeaveConflict(
      { leaveType: 'hourly', date: '2026-10-30', startTime: '09:00', endTime: '11:00' },
      existingRequests
    );
    expect(hourlyCand.hasConflict).toBe(true);
    expect(hourlyCand.conflictingRequest?.id).toBe('req-1');
  });

  it('6. ignores Rejected and Cancelled requests', () => {
    const resultRejected = findLeaveConflict(
      { leaveType: 'daily', startDate: '2026-11-05', endDate: '2026-11-05' },
      existingRequests
    );
    expect(resultRejected.hasConflict).toBe(false);

    const resultCancelled = findLeaveConflict(
      { leaveType: 'hourly', date: '2026-11-06', startTime: '10:00', endTime: '12:00' },
      existingRequests
    );
    expect(resultCancelled.hasConflict).toBe(false);
  });

  it('7. excludes request ID when editing an existing request', () => {
    const result = findLeaveConflict(
      { leaveType: 'daily', startDate: '2026-10-30', endDate: '2026-10-31' },
      existingRequests,
      'req-1'
    );
    expect(result.hasConflict).toBe(false);
  });

  it('8. formats Persian conflict message correctly', () => {
    const msgDaily = formatConflictMessage(existingRequests[0]);
    expect(msgDaily).toContain('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
    expect(msgDaily).toContain('مرخصی روزانه');

    const msgHourly = formatConflictMessage(existingRequests[1]);
    expect(msgHourly).toContain('برای تاریخ انتخاب‌شده، درخواست مرخصی دیگری ثبت شده است.');
    expect(msgHourly).toContain('مرخصی ساعتی');
    expect(msgHourly).toContain('از 08:00 تا 12:00');
  });
});
