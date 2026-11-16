import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { AttendanceService } from '../../services/attendance.service';
import { LeaveRequestService } from '../../services/leave-request.service';
import { AttendanceRecordDto } from '../../models/employee-attendance.models';
import { formatAttendanceTime } from '../../../../shared/utils/attendance-status.util';
import { LeaveRequestDto, LeaveSummaryDto } from '../../models/leave-request.model';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { SummaryCardComponent, SummaryTone } from '../../../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent, BadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PersianDigitsPipe,
    JalaliPipe,
    SummaryCardComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly persianDateService = inject(PersianDateService);

  readonly todayFormattedDate = this.persianDateService.getTodayFormatted();

  readonly isLoadingUser = signal<boolean>(!this.authService.userDetails() && !this.authService.currentUser());

  // Attendance signals
  /** Open attendance record of the employee (GET /api/attendance/current). */
  readonly todayAttendance = signal<AttendanceRecordDto | null>(null);
  readonly isLoadingAttendance = signal<boolean>(true);
  readonly attendanceError = signal<boolean>(false);

  // Hourly leave countdown timer state
  readonly remainingCountdown = signal<string | null>(null);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Active leave computed helpers
  readonly activeLeaveInfo = computed(() => {
    // The attendance API does not embed leave data, so the active leave is derived
    // from the approved leave requests loaded for this employee.
    const requests = this.recentLeaveRequests();
    const approved = requests.filter((r) => r.status === 'approved');
    if (approved.length === 0) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayLeave = approved.find((r) => {
      if (r.leaveType === 'hourly') {
        const reqDate = r.date || r.startDate;
        if (!reqDate) return false;
        const normDate = reqDate.trim().split('T')[0];
        return normDate === todayStr;
      }

      if (!r.startDate) return false;
      const normStart = r.startDate.trim().split('T')[0];
      const normEnd = (r.endDate || r.startDate).trim().split('T')[0];
      if (!normStart || !normEnd) return false;

      return normStart <= todayStr && normEnd >= todayStr;
    });
    if (!todayLeave) return null;

    return {
      isHourly: todayLeave.leaveType === 'hourly',
      startDate: todayLeave.startDate,
      endDate: todayLeave.endDate,
      startTime: todayLeave.startTime || null,
      endTime: todayLeave.endTime || null,
      leaveCategoryName: todayLeave.categoryName || null,
    };
  });

  readonly isAttendanceBlocked = computed(() => !!this.activeLeaveInfo());

  readonly leaveRestrictionBannerMessage = computed(() => {
    const leave = this.activeLeaveInfo();
    if (!leave) return null;

    if (leave.isHourly) {
      const timeText = leave.startTime && leave.endTime ? ` (${leave.startTime} تا ${leave.endTime})` : '';
      return `شما در مرخصی ساعتی ${timeText} هستید و امکان ثبت تردد در این بازه وجود ندارد.`;
    }

    return 'شما امروز در مرخصی هستید و امکان ثبت تردد ندارید.';
  });

  // Leave signals
  readonly leaveSummary = signal<LeaveSummaryDto | null>(null);
  readonly recentLeaveRequests = signal<LeaveRequestDto[]>([]);
  readonly isLoadingLeaves = signal<boolean>(true);

  readonly userGreetingName = computed(() => {
    const details = this.authService.userDetails();
    if (details) {
      const first = details.firstName ? details.firstName.trim() : '';
      const last = details.lastName ? details.lastName.trim() : '';
      const full = `${first} ${last}`.trim();
      if (full) {
        return full;
      }
    }

    const user = this.authService.currentUser();
    if (user && user.fullName && user.fullName.trim()) {
      return user.fullName.trim();
    }

    return 'کارمند';
  });

  readonly employeeName = computed(() => this.userGreetingName());

  readonly avatarInitial = computed(() => {
    const name = this.userGreetingName();
    return name ? name.charAt(0) : 'ک';
  });

  readonly hasActiveCheckIn = computed(() => {
    const att = this.todayAttendance();
    return !!att && !att.checkOutTime;
  });

  readonly isCheckedOut = computed(() => !!this.todayAttendance()?.checkOutTime);

  readonly todayCheckInTime = computed(() =>
    formatAttendanceTime(this.todayAttendance()?.checkInTime)
  );

  readonly todayCheckOutTime = computed(() =>
    formatAttendanceTime(this.todayAttendance()?.checkOutTime)
  );

  readonly attendanceStatusLabel = computed(() => {
    if (this.isCheckedOut()) return 'خروج ثبت شده';
    if (this.hasActiveCheckIn()) return 'حاضر (ورود ثبت شده)';
    return 'در انتظار ثبت حضور';
  });

  readonly attendanceStatusSummaryLabel = computed(() => {
    if (this.isCheckedOut()) return 'خروج ثبت شده';
    if (this.hasActiveCheckIn()) return 'حاضر در محل کار';
    return 'ثبت‌نشده';
  });

  readonly attendanceSummaryTone = computed<SummaryTone>(() => {
    if (this.isCheckedOut()) return 'default';
    if (this.hasActiveCheckIn()) return 'success';
    return 'warning';
  });

  readonly attendanceStatusTone = computed<BadgeTone>(() => {
    if (this.isCheckedOut()) return 'neutral';
    if (this.hasActiveCheckIn()) return 'success';
    return 'warning';
  });

  readonly attendanceStatusClass = computed(() => {
    if (this.isCheckedOut()) return 'bg-slate-100 text-slate-800';
    if (this.hasActiveCheckIn()) return 'bg-emerald-100 text-emerald-800';
    return 'bg-amber-100 text-amber-800';
  });

  readonly latestLeaveRequest = computed(() => {
    const list = this.recentLeaveRequests();
    return list.length > 0 ? list[0] : null;
  });

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.isLoadingUser.set(true);
    }
    this.authService.getCurrentUser().subscribe({
      next: () => this.isLoadingUser.set(false),
      error: () => this.isLoadingUser.set(false),
    });

    this.loadTodayAttendance();
    this.loadLeaveData();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  loadTodayAttendance(): void {
    this.isLoadingAttendance.set(true);
    this.attendanceError.set(false);

    this.attendanceService.getCurrentAttendance().subscribe({
      next: (data) => {
        this.todayAttendance.set(data);
        this.isLoadingAttendance.set(false);
        this.setupHourlyLeaveTimer();
      },
      error: (err) => {
        console.error('Failed to load today attendance:', err);
        this.attendanceError.set(true);
        this.isLoadingAttendance.set(false);
      },
    });
  }

  private setupHourlyLeaveTimer(): void {
    this.stopCountdown();

    const leave = this.activeLeaveInfo();
    if (!leave || !leave.isHourly || !leave.endTime) {
      this.remainingCountdown.set(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const [endH, endM, endS] = leave.endTime!.split(':').map((v) => parseInt(v, 10) || 0);

      const target = new Date(now);
      target.setHours(endH, endM, endS || 0, 0);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        this.remainingCountdown.set('00:00:00');
        this.stopCountdown();
        this.loadTodayAttendance();
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      this.remainingCountdown.set(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  loadLeaveData(): void {
    this.isLoadingLeaves.set(true);

    this.leaveRequestService.getLeaveRequests().subscribe({
      next: (requests) => {
        const list = requests || [];
        this.recentLeaveRequests.set(list);
        // The active leave is derived from these requests, so the hourly-leave
        // countdown can only be evaluated once they arrive.
        this.setupHourlyLeaveTimer();

        const pending = list.filter((r) => r.status === 'pending').length;
        const approved = list.filter((r) => r.status === 'approved').length;
        const rejected = list.filter((r) => r.status === 'rejected').length;
        this.leaveSummary.set({
          pendingCount: pending,
          approvedCount: approved,
          rejectedCount: rejected,
        });

        this.isLoadingLeaves.set(false);
      },
      error: (err) => {
        console.error('Failed to load leave requests:', err);
        this.isLoadingLeaves.set(false);
      },
    });
  }

  getLeaveStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'در انتظار بررسی';
      case 'approved':
        return 'تایید شده';
      case 'rejected':
        return 'رد شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return 'نامشخص';
    }
  }

  getLeaveStatusTone(status: string): BadgeTone {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
      default:
        return 'neutral';
    }
  }

  getLeaveStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-800';
      case 'cancelled':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}
