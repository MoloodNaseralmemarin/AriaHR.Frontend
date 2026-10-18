import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterManager } from '../../models/system-admin.models';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { normalizePersianDigits } from '../../../../shared/utils/mobile-number.util';

type ManagerFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-system-admin-managers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './system-admin-managers.component.html',
  styleUrl: './system-admin-managers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminManagersComponent {
  readonly data = inject(SystemAdminDataService);

  readonly searchTerm = signal('');
  readonly activeFilter = signal<ManagerFilter>('all');

  readonly filters: { value: ManagerFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'active', label: 'فعال' },
    { value: 'inactive', label: 'غیرفعال' },
  ];

  readonly managers = this.data.managers;

  readonly filteredManagers = computed<CenterManager[]>(() => {
    let list = this.managers();
    const filter = this.activeFilter();
    const query = this.searchTerm().trim().toLowerCase();

    if (filter === 'active') {
      list = list.filter((m) => m.active);
    } else if (filter === 'inactive') {
      list = list.filter((m) => !m.active);
    }

    if (query) {
      const asciiQuery = normalizePersianDigits(query).toLowerCase();
      list = list.filter((m) => {
        const name = (m.name ?? '').toLowerCase();
        const centerName = (m.centerName ?? '').toLowerCase();
        const mobileNumber = (m.mobileNumber ?? '').toLowerCase();

        return (
          name.includes(query) ||
          centerName.includes(query) ||
          mobileNumber.includes(query) ||
          (asciiQuery && mobileNumber.includes(asciiQuery))
        );
      });
    }

    return list;
  });

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  setFilter(filter: ManagerFilter): void {
    this.activeFilter.set(filter);
  }

  getAvatarInitial(name: string): string {
    return name ? name.trim().charAt(0) : 'م';
  }
}
