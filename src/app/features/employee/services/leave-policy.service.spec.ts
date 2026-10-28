import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { LeavePolicyService } from './leave-policy.service';
import { LeaveCategoryDto } from '../../leave-categories/models/leave-category.dto';
import { LeaveRequestDto } from '../models/leave-request.model';

describe('LeavePolicyService', () => {
  let service: LeavePolicyService;

  beforeEach(() => {
    service = new LeavePolicyService();
  });

  const sampleCategory: LeaveCategoryDto = {
    id: 'cat-annual',
    organizationId: 'org-1',
    name: 'استحقاقی',
    maxDaysPerYear: 30,
    isPaid: true,
    requiresAttachment: false,
    isActive: true,
  };

  const sickCategory: LeaveCategoryDto = {
    id: 'cat-sick',
    organizationId: 'org-1',
    name: 'استعلاجی',
    maxDaysPerYear: 0, // No fixed annual limit
    isPaid: true,
    requiresAttachment: true,
    isActive: true,
  };

  it('should calculate hourly minutes correctly', () => {
    expect(service.calculateHourlyMinutes('08:00', '12:00')).toBe(240); // 4 hours
    expect(service.calculateHourlyMinutes('08:00', '16:00')).toBe(480); // 8 hours
    expect(service.calculateHourlyMinutes('16:00', '08:00')).toBe(0); // Invalid end <= start
    expect(service.calculateHourlyMinutes('', '')).toBe(0);
  });

  it('should detect when hourly threshold (8 hours = 480 mins) is reached or exceeded', () => {
    expect(service.isHourlyThresholdExceeded('08:00', '12:00')).toBe(false);
    expect(service.isHourlyThresholdExceeded('08:00', '16:00')).toBe(true);
    expect(service.isHourlyThresholdExceeded('08:00', '17:00')).toBe(true);
  });

  it('should calculate consumed days including pending and approved requests while excluding rejected and cancelled ones', () => {
    const requests: LeaveRequestDto[] = [
      {
        id: '1',
        leaveType: 'daily',
        leaveCategoryId: 'cat-annual',
        startDate: '2026-01-01',
        endDate: '2026-01-05', // 5 days
        status: 'approved',
        createdAt: '2026-01-01T00:00:00Z',
        durationText: '5 روز',
      },
      {
        id: '2',
        leaveType: 'daily',
        leaveCategoryId: 'cat-annual',
        startDate: '2026-02-01',
        endDate: '2026-02-03', // 3 days
        status: 'pending',
        createdAt: '2026-02-01T00:00:00Z',
        durationText: '3 روز',
      },
      {
        id: '3',
        leaveType: 'daily',
        leaveCategoryId: 'cat-annual',
        startDate: '2026-03-01',
        endDate: '2026-03-10', // 10 days (rejected -> excluded)
        status: 'rejected',
        createdAt: '2026-03-01T00:00:00Z',
        durationText: '10 روز',
      },
      {
        id: '4',
        leaveType: 'daily',
        leaveCategoryId: 'cat-annual',
        startDate: '2026-04-01',
        endDate: '2026-04-05', // 5 days (cancelled -> excluded)
        status: 'cancelled',
        createdAt: '2026-04-01T00:00:00Z',
        durationText: '5 روز',
      },
    ];

    const consumed = service.calculateConsumedDays(sampleCategory, requests);
    expect(consumed).toBe(8); // 5 approved + 3 pending = 8 days
  });

  it('should validate entitlement and accept request when within remaining balance', () => {
    const requests: LeaveRequestDto[] = [
      {
        id: '1',
        leaveType: 'daily',
        leaveCategoryId: 'cat-annual',
        startDate: '2026-01-01',
        endDate: '2026-01-20', // 20 days
        status: 'approved',
        createdAt: '2026-01-01T00:00:00Z',
        durationText: '20 روز',
      },
    ];

    // 20 consumed out of 30. Requesting 5 days -> 25 <= 30
    const result = service.validateEntitlement(sampleCategory, 5, requests);
    expect(result.valid).toBe(true);
  });

  it('should reject request when exceeding remaining entitlement and return Persian error', () => {
    const requests: LeaveRequestDto[] = [
      {
        id: '1',
        leaveType: 'daily',
        leaveCategoryId: 'cat-annual',
        startDate: '2026-01-01',
        endDate: '2026-01-28', // 28 days
        status: 'approved',
        createdAt: '2026-01-01T00:00:00Z',
        durationText: '28 روز',
      },
    ];

    // 28 consumed out of 30. Requesting 5 days -> 33 > 30
    const result = service.validateEntitlement(sampleCategory, 5, requests);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('حد مجاز مرخصی استحقاقی برای شما 30 روز در سال می‌باشد');
  });

  it('should allow sick leave without arbitrary fixed monthly cap', () => {
    const requests: LeaveRequestDto[] = [];
    const result = service.validateEntitlement(sickCategory, 10, requests);
    expect(result.valid).toBe(true);
  });
});
