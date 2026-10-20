import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OrganizationService } from '../../../organizations/services/organization.service';
import { OrganizationResponseDto } from '../../../organizations/models/organization-response.dto';
import { getOrganizationTypeLabel } from '../../../organizations/models/organization-type.enum';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-system-admin-centers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    PersianDigitsPipe,
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

  readonly organizations = signal<OrganizationResponseDto[]>([]);

  readonly filteredOrganizations = computed(() => {
    const text = this.query().trim().toLowerCase();
    const currentFilter = this.filter();

    return this.organizations().filter((org) => {
      const managerName = `${org.managerFirstName ?? ''} ${org.managerLastName ?? ''}`.trim();
      const searchHaystack = `${org.name ?? ''} ${org.code ?? ''} ${managerName} ${org.phone ?? ''} ${org.managerMobile ?? ''}`.toLowerCase();

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

    this.organizationService.getOrganizations().subscribe({
      next: (data) => {
        this.organizations.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message ||
          err?.message ||
          'خطایی در دریافت اطلاعات مراکز رخ داد. لطفا مجدداً تلاش کنید.';
        this.error.set(errorMsg);
        this.loading.set(false);
      },
    });
  }

  getTypeLabel(type: any): string {
    return getOrganizationTypeLabel(type);
  }

  getManagerFullName(org: OrganizationResponseDto): string {
    const fullName = `${org.managerFirstName ?? ''} ${org.managerLastName ?? ''}`.trim();
    return fullName || 'تعیین نشده';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'فعال' : 'غیرفعال';
  }
}
