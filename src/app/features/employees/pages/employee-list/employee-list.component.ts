import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../services/employee.service';
import { EmployeeResponseDto } from '../../models/employee-response.dto';
import { AuthService } from '../../../../core/auth/auth.service';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';

type EmployeeFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    ToastComponent,
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);

  readonly employees = signal<EmployeeResponseDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<EmployeeFilter>('all');

  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize()))
  );

  readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<ToastTone>('success');

  readonly filters: { value: EmployeeFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'active', label: 'فعال' },
    { value: 'inactive', label: 'غیرفعال' },
  ];

  filteredEmployees = computed<EmployeeResponseDto[]>(() => {
    const list = this.employees();
    const filter = this.activeFilter();
    if (filter === 'all') return list;
    return list.filter((e) => (filter === 'active' ? e.isActive : !e.isActive));
  });

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.authService.getCurrentUser().subscribe({
        next: () => this.loadEmployees(),
        error: () => this.loadEmployees(),
      });
    } else {
      this.loadEmployees();
    }
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const orgId = this.authService.userDetails()?.organizationId || undefined;

    this.employeeService
      .getEmployees(
        this.pageNumber(),
        this.pageSize(),
        this.searchTerm().trim() || undefined,
        orgId
      )
      .subscribe({
        next: (response) => {
          this.employees.set(response.items || []);
          this.totalCount.set(response.totalCount || 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || 'خطا در دریافت لیست کارمندان. لطفاً دوباره تلاش کنید.'
          );
          this.isLoading.set(false);
        },
      });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
    this.loadEmployees();
  }

  setFilter(filter: EmployeeFilter): void {
    this.activeFilter.set(filter);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageNumber.set(page);
    this.loadEmployees();
  }

  toggleActive(employee: EmployeeResponseDto): void {
    const action$ = employee.isActive
      ? this.employeeService.deactivateEmployee(employee.id)
      : this.employeeService.activateEmployee(employee.id);

    action$.subscribe({
      next: (updated) => {
        const nextState = updated && typeof updated.isActive === 'boolean' ? updated.isActive : !employee.isActive;
        this.employees.update((list) =>
          list.map((e) => (e.id === employee.id ? { ...e, isActive: nextState } : e))
        );
        this.showToast(
          nextState ? 'کارمند با موفقیت فعال شد.' : 'کارمند با موفقیت غیرفعال شد.',
          'success'
        );
      },
      error: () => {
        // Fallback update call if dedicated endpoint is not found
        const fallbackDto = {
          organizationId: employee.organizationId,
          personnelCode: employee.personnelCode,
          nationalCode: employee.nationalCode,
          birthDate: employee.birthDate,
          gender: employee.gender,
          hireDate: employee.hireDate,
          isActive: !employee.isActive,
          profileImagePath: employee.profileImagePath,
        };
        this.employeeService.updateEmployee(employee.id, fallbackDto).subscribe({
          next: () => {
            this.employees.update((list) =>
              list.map((e) => (e.id === employee.id ? { ...e, isActive: !e.isActive } : e))
            );
            this.showToast('وضعیت کارمند بروزرسانی شد.', 'success');
          },
          error: () => {
            this.showToast('خطا در تغییر وضعیت کارمند.', 'error');
          },
        });
      },
    });
  }

  deleteEmployee(employee: EmployeeResponseDto): void {
    const confirmed = confirm(
      `آیا از حذف کارمند با کد پرسنلی «${employee.personnelCode}» مطمئن هستید؟`
    );
    if (!confirmed) return;

    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.employees.update((list) => list.filter((e) => e.id !== employee.id));
        this.totalCount.update((count) => Math.max(0, count - 1));
        this.showToast('کارمند با موفقیت حذف شد.', 'success');
      },
      error: () => {
        this.showToast('خطا در حذف کارمند.', 'error');
      },
    });
  }

  showToast(msg: string, tone: ToastTone = 'success'): void {
    this.toastMessage.set(msg);
    this.toastTone.set(tone);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
