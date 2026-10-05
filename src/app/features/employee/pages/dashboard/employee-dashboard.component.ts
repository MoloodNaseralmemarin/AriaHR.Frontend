import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { PersianDateService } from '../../../../core/services/persian-date.service';
import { AttendanceService } from '../../services/attendance.service';
import { LeaveRequestService } from '../../services/leave-request.service';
import { TodayAttendanceDto } from '../../models/employee-attendance.models';
import { LeaveRequestDto, LeaveSummaryDto } from '../../models/leave-request.model';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PersianDigitsPipe],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly persianDateService = inject(PersianDateService);

  readonly todayFormattedDate = this.persianDateService.getTodayFormatted();

  readonly isLoadingUser = signal<boolean>(!this.authService.userDetails() && !this.authService.currentUser());

  // Attendance signals
  readonly todayAttendance = signal<TodayAttendanceDto | null>(null);
  readonly isLoadingAttendance = signal<boolean>(true);
  readonly attendanceError = signal<boolean>(false);

  // Leave signals
  readonly leaveSummary = signal<LeaveSummaryDto | null>(null);
  readonly recentLeaveRequests = signal<LeaveRequestDto[]>([]);
  readonly isLoadingLeaves = signal<boolean>(true);

  readonly employeeName = computed(() => {
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

  readonly avatarInitial = computed(() => {
    const name = this.employeeName();
    return name ? name.charAt(0) : 'ک';
  });

  readonly attendanceStatusLabel = computed(() => {
    const att = this.todayAttendance();
    if (!att) return 'در انتظار ثبت حضور';

    if (att.isCheckedOut) return 'خروج ثبت شده';
    if (att.isCheckedIn) return 'حاضر (ورود ثبت شده)';

    switch (att.status) {
      case 'checkedIn':
        return 'حاضر (ورود ثبت شده)';
      case 'checkedOut':
        return 'خروج ثبت شده';
      case 'notCheckedIn':
      default:
        return 'عدم حضور / هنوز وارد نشده';
    }
  });

  readonly attendanceStatusClass = computed(() => {
    const att = this.todayAttendance();
    if (!att) return 'bg-amber-100 text-amber-800';

    if (att.isCheckedOut) return 'bg-slate-100 text-slate-800';
    if (att.isCheckedIn) return 'bg-emerald-100 text-emerald-800';

    switch (att.status) {
      case 'checkedIn':
        return 'bg-emerald-100 text-emerald-800';
      case 'checkedOut':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
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

  loadTodayAttendance(): void {
    this.isLoadingAttendance.set(true);
    this.attendanceError.set(false);

    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => {
        this.todayAttendance.set(data);
        this.isLoadingAttendance.set(false);
      },
      error: (err) => {
        console.error('Failed to load today attendance:', err);
        this.attendanceError.set(true);
        this.isLoadingAttendance.set(false);
      },
    });
  }

  loadLeaveData(): void {
    this.isLoadingLeaves.set(true);

    this.leaveRequestService.getLeaveSummary().subscribe({
      next: (summary) => this.leaveSummary.set(summary),
      error: (err) => console.error('Failed to load leave summary:', err),
    });

    this.leaveRequestService.getLeaveRequests().subscribe({
      next: (requests) => {
        this.recentLeaveRequests.set(requests || []);
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
