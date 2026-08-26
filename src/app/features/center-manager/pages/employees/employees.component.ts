import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

import { mockEmployees } from '../../mock-data/mock-data';
import { attendanceStatusMap } from '../../../../shared/utils/status-map';
import { Employee } from '../../../../shared/models/center-manager.models';

type EmployeeFilter = 'all' | 'active' | 'inactive';

/**
 * /center/employees
 * Desktop: table/list layout. Mobile: employee cards (never a squeezed table).
 * Search + status filter operate purely on the in-memory mock list.
 */
@Component({
  selector: 'app-center-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css'],
})
export class EmployeesComponent {
  // Set to true to preview the loading skeleton state.
  isLoading = false;

  allEmployees = mockEmployees;
  searchTerm = signal('');
  activeFilter = signal<EmployeeFilter>('all');

  attendanceStatusMap = attendanceStatusMap;

  filters: { value: EmployeeFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'active', label: 'فعال' },
    { value: 'inactive', label: 'غیرفعال' },
  ];

  filteredEmployees = computed<Employee[]>(() => {
    const term = this.searchTerm().trim();
    const filter = this.activeFilter();

    return this.allEmployees.filter((emp) => {
      const matchesFilter = filter === 'all' ? true : emp.status === filter;
      const matchesSearch =
        term.length === 0 ||
        emp.fullName.includes(term) ||
        emp.role.includes(term) ||
        emp.mobile.includes(term);
      return matchesFilter && matchesSearch;
    });
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  setFilter(filter: EmployeeFilter): void {
    this.activeFilter.set(filter);
  }

  onViewDetails(employee: Employee): void {
    // Visual-only action — integrator can route to /center/employees/:id
    console.log('view employee details (UI only):', employee.id);
  }
}
