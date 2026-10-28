import { Injectable } from '@angular/core';
import { LeaveCategoryDto } from '../../leave-categories/models/leave-category.dto';
import { LeaveRequestDto } from '../models/leave-request.model';

export interface PolicyValidationResult {
  valid: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeavePolicyService {
  readonly HOURLY_TO_DAILY_THRESHOLD_MINUTES = 480; // 8 hours

  /**
   * Calculates duration in total minutes from startTime and endTime ("HH:mm").
   * Returns 0 if invalid or end <= start.
   */
  calculateHourlyMinutes(startTime: string | null | undefined, endTime: string | null | undefined): number {
    if (!startTime || !endTime) return 0;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;

    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;
    const diff = endTotal - startTotal;
    return diff > 0 ? diff : 0;
  }

  /**
   * Checks if an hourly request duration reaches or exceeds 8 hours (480 minutes).
   */
  isHourlyThresholdExceeded(startTime: string | null | undefined, endTime: string | null | undefined): boolean {
    const minutes = this.calculateHourlyMinutes(startTime, endTime);
    return minutes >= this.HOURLY_TO_DAILY_THRESHOLD_MINUTES;
  }

  /**
   * Calculates consumed days for a given leave category across active (pending + approved) requests.
   * Ignores rejected and cancelled requests.
   */
  calculateConsumedDays(category: LeaveCategoryDto, requests: LeaveRequestDto[]): number {
    if (!category || !requests || requests.length === 0) return 0;

    const currentYear = new Date().getFullYear();

    const activeRequests = requests.filter((r) => {
      if (r.leaveCategoryId !== category.id && r.categoryName !== category.name) {
        return false;
      }
      // Only pending and approved
      if (r.status !== 'pending' && r.status !== 'approved') {
        return false;
      }
      // Current year filter
      if (r.createdAt) {
        const reqYear = new Date(r.createdAt).getFullYear();
        if (!isNaN(reqYear) && reqYear !== currentYear) {
          return false;
        }
      }
      return true;
    });

    let totalDays = 0;

    for (const req of activeRequests) {
      if (req.leaveType === 'daily') {
        if (req.startDate && req.endDate) {
          const d1 = new Date(req.startDate);
          const d2 = new Date(req.endDate);
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
            totalDays += diffDays;
          } else {
            totalDays += 1;
          }
        } else {
          totalDays += 1;
        }
      } else if (req.leaveType === 'hourly') {
        const minutes = this.calculateHourlyMinutes(req.startTime, req.endTime);
        totalDays += minutes / 480; // 8 hours = 1 day
      }
    }

    return Math.round(totalDays * 100) / 100;
  }

  /**
   * Validates requested leave duration against category entitlement limits (maxDaysPerYear).
   */
  validateEntitlement(
    category: LeaveCategoryDto | null | undefined,
    requestedDays: number,
    existingRequests: LeaveRequestDto[]
  ): PolicyValidationResult {
    if (!category) {
      return { valid: true };
    }

    // Check maxDaysPerYear if defined and > 0
    if (category.maxDaysPerYear && category.maxDaysPerYear > 0) {
      const consumedDays = this.calculateConsumedDays(category, existingRequests);
      const remainingDays = category.maxDaysPerYear - consumedDays;

      if (requestedDays > remainingDays) {
        return {
          valid: false,
          message: `حد مجاز مرخصی ${category.name} برای شما ${category.maxDaysPerYear} روز در سال می‌باشد (موجودی باقی‌مانده: ${Math.max(0, remainingDays)} روز).`,
        };
      }
    }

    return { valid: true };
  }
}
