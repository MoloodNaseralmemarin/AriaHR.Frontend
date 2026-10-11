import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

import { ShiftService } from '../../services/shift.service';
import { ShiftDto } from '../../models/shift.dto';

@Component({
  selector: 'app-center-shifts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ToastComponent,
  ],
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.css'],
})
export class ShiftsComponent implements OnInit {
  private readonly shiftService = inject(ShiftService);
  private readonly router = inject(Router);

  readonly shifts = signal<ShiftDto[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly togglingId = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.shiftService.getShifts().subscribe({
      next: (data) => {
        this.shifts.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'خطا در دریافت لیست شیفت‌ها. لطفاً دوباره تلاش کنید.'
        );
      },
    });
  }

  toggleStatus(shift: ShiftDto): void {
    if (this.togglingId()) return;

    this.togglingId.set(shift.id);
    const action$ = shift.isActive
      ? this.shiftService.deactivateShift(shift.id)
      : this.shiftService.activateShift(shift.id);

    action$.subscribe({
      next: (updatedShift) => {
        this.togglingId.set(null);
        this.shifts.update((list) =>
          list.map((item) =>
            item.id === shift.id
              ? { ...item, isActive: updatedShift ? updatedShift.isActive : !shift.isActive }
              : item
          )
        );
        this.toastMessage.set(
          shift.isActive ? 'شیفت با موفقیت غیرفعال شد.' : 'شیفت با موفقیت فعال شد.'
        );
      },
      error: () => {
        this.togglingId.set(null);
        // Fallback using full update if specific endpoint is not supported by backend
        const updateRequest = {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          isActive: !shift.isActive,
        };
        this.shiftService.updateShift(shift.id, updateRequest).subscribe({
          next: () => {
            this.shifts.update((list) =>
              list.map((item) =>
                item.id === shift.id ? { ...item, isActive: !shift.isActive } : item
              )
            );
            this.toastMessage.set(
              shift.isActive ? 'شیفت با موفقیت غیرفعال شد.' : 'شیفت با موفقیت فعال شد.'
            );
          },
          error: (err) => {
            this.errorMessage.set(
              err?.error?.message || 'خطا در تغییر وضعیت شیفت. لطفاً مجدداً تلاش نمایید.'
            );
          },
        });
      },
    });
  }

  onAddShift(): void {
    this.router.navigate(['/center-manager/shifts/create']);
  }
}
