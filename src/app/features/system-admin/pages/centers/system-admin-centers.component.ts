import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { OrganizationService } from '../../../organizations/services/organization.service';
import { OrganizationListItemDto } from '../../../organizations/models/organization-list-item.dto';
import { getOrganizationTypeLabel } from '../../../organizations/models/organization-type.enum';
import { parseApiError } from '../../../../core/http/api-error.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';

@Component({
  selector: 'app-system-admin-centers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    PersianDigitsPipe,
    JalaliPipe,
  ],
  templateUrl: './system-admin-centers.component.html',
  styleUrl: './system-admin-centers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCentersComponent implements OnInit {
  private readonly organizationService = inject(OrganizationService);

  readonly query = signal('');
  readonly filter = signal<'all' | 'active' | 'inactive'>('all');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly organizations = signal<OrganizationListItemDto[]>([]);

  readonly filteredOrganizations = computed(() => {
    const text = this.query().trim().toLowerCase();
    const currentFilter = this.filter();

    return this.organizations().filter((org) => {
      const managerName = this.getManagerFullName(org);
      const phone = org.centerPhone ?? '';
      const searchHaystack =
        `${org.name ?? ''} ${org.code ?? ''} ${managerName} ${phone} ${org.managerMobile ?? ''}`.toLowerCase();

      const matchesText = !text || searchHaystack.includes(text);
      const matchesFilter =
        currentFilter === 'all' ||
        (currentFilter === 'active' && org.isActive) ||
        (currentFilter === 'inactive' && !org.isActive);

      return matchesText && matchesFilter;
    });
  });

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading.set(true);
    this.error.set(null);

    this.organizationService
      .getOrganizations()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.organizations.set(data ?? []),
        error: (error) => {
          this.organizations.set([]);
          this.error.set(parseApiError(error).message);
        },
      });
  }

  getTypeLabel(org: OrganizationListItemDto): string {
    return getOrganizationTypeLabel(org.organizationType);
  }

  getManagerFullName(org: OrganizationListItemDto): string {
    return org.managerFullName?.trim() || '—';
  }

  getCenterPhone(org: OrganizationListItemDto): string {
    return org.centerPhone || '—';
  }
}
