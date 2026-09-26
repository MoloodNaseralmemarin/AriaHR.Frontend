import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeResponseDto } from '../../models/employee-response.dto';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);

  readonly employees = signal<EmployeeResponseDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize()))
  );

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.employeeService
      .getEmployees(this.pageNumber(), this.pageSize(), this.searchTerm() || undefined)
      .subscribe({
        next: (response) => {
          this.employees.set(response.items);
          this.totalCount.set(response.totalCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('خطا در دریافت لیست کارمندان.');
          this.isLoading.set(false);
        }
      });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
    this.loadEmployees();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.pageNumber.set(page);
    this.loadEmployees();
  }

  toggleActive(employee: EmployeeResponseDto): void {
    const action$ = employee.isActive
      ? this.employeeService.deactivateEmployee(employee.id)
      : this.employeeService.activateEmployee(employee.id);

    action$.subscribe({
      next: (updated) => {
        this.employees.update((list) =>
          list.map((e) => (e.id === updated.id ? updated : e))
        );
      },
      error: () => {
        this.errorMessage.set('خطا در تغییر وضعیت کارمند.');
      }
    });
  }

  deleteEmployee(employee: EmployeeResponseDto): void {
    const confirmed = confirm(
      `آیا از حذف کارمند با کد پرسنلی «${employee.personnelCode}» مطمئن هستید؟`
    );
    if (!confirmed) {
      return;
    }

    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.employees.update((list) => list.filter((e) => e.id !== employee.id));
        this.totalCount.update((count) => count - 1);
      },
      error: () => {
        this.errorMessage.set('خطا در حذف کارمند.');
      }
    });
  }
}
