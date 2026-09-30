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
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { normalizePersianDigits } from '../../../../shared/utils/mobile-number.util';

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
    JalaliPipe,
    PersianDigitsPipe,
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

  readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<ToastTone>('success');

  readonly filters: { value: EmployeeFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'active', label: 'فعال' },
    { value: 'inactive', label: 'غیرفعال' },
  ];

  filteredEmployees = computed<EmployeeResponseDto[]>(() => {
    let list = this.employees();
    const filter = this.activeFilter();
    const query = this.searchTerm().trim().toLowerCase();

    if (filter === 'active') {
      list = list.filter((e) => e.isActive);
    } else if (filter === 'inactive') {
      list = list.filter((e) => !e.isActive);
    }

    if (query) {
      const asciiQuery = normalizePersianDigits(query).toLowerCase();
      list = list.filter((e) => {
        const fullName = `${e.firstName ?? ''} ${e.lastName ?? ''}`.toLowerCase();
        const personnelCode = (e.personnelCode ?? '').toLowerCase();
        const nationalCode = (e.nationalCode ?? '').toLowerCase();
        const phoneNumber = (e.phoneNumber ?? '').toLowerCase();
        const email = (e.email ?? '').toLowerCase();

        return (
          fullName.includes(query) ||
          personnelCode.includes(asciiQuery) ||
          nationalCode.includes(asciiQuery) ||
          phoneNumber.includes(asciiQuery) ||
          email.includes(query)
        );
      });
    }

    return list;
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

    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data || []);
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
  }

  setFilter(filter: EmployeeFilter): void {
    this.activeFilter.set(filter);
  }

  getFullName(emp: EmployeeResponseDto): string {
    const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
    return name || '—';
  }

  getGenderLabel(gender?: string | null): string {
    if (!gender) return '—';
    if (gender === 'Male' || gender === 'مرد') return 'مرد';
    if (gender === 'Female' || gender === 'زن') return 'زن';
    return gender;
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
        const fallbackDto = {
          organizationId: employee.organizationId,
          personnelCode: employee.personnelCode,
          nationalCode: employee.nationalCode,
          birthDate: employee.birthDate,
          gender: employee.gender || undefined,
          hireDate: employee.hireDate,
          isActive: !employee.isActive,
          profileImagePath: employee.profileImagePath || undefined,
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
    const fullName = this.getFullName(employee);
    const confirmed = confirm(
      `آیا از حذف کارمند «${fullName}» با کد پرسنلی «${employee.personnelCode}» مطمئن هستید؟`
    );
    if (!confirmed) return;

    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.employees.update((list) => list.filter((e) => e.id !== employee.id));
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
