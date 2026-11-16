import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { OrganizationService } from '../../../organizations/services/organization.service';
import { BranchListItemDto } from '../../../organizations/models/branch-list-item.dto';
import { parseApiError } from '../../../../core/http/api-error.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-system-admin-center-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    StatusBadgeComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './system-admin-center-details.component.html',
  styleUrl: './system-admin-center-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCenterDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly organizationService = inject(OrganizationService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly center = signal<BranchListItemDto | null>(null);

  readonly isUpdatingStatus = signal(false);
  readonly statusError = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.loadCenterDetails();
    });
  }

  loadCenterDetails(): void {
    const centerId = this.route.snapshot.paramMap.get('id');
    const organizationId =
      this.route.snapshot.queryParamMap.get('organizationId') || centerId;

    if (!centerId || !organizationId) {
      this.error.set('شناسه مرکز یا سازمان معتبر نیست.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.organizationService.getOrganizationCenters(organizationId).subscribe({
      next: (centers) => {
        const found = centers?.find((c) => String(c.id) === String(centerId));
        if (found) {
          this.center.set(found);
        } else {
          this.error.set('مرکز مورد نظر با این شناسه یافت نشد.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(parseApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  /** Activates or deactivates the branch through `PATCH /api/centers/{id}/status`. */
  toggleStatus(): void {
    const center = this.center();
    if (!center || this.isUpdatingStatus()) {
      return;
    }

    this.isUpdatingStatus.set(true);
    this.statusError.set(null);

    this.organizationService
      .updateCenterStatus(center.id, { isActive: !center.isActive })
      .pipe(finalize(() => this.isUpdatingStatus.set(false)))
      .subscribe({
        next: (updated) => this.center.set(updated),
        error: (err) => this.statusError.set(parseApiError(err).message),
      });
  }

  getDisplayValue(value: string | null | undefined): string {
    if (!value || !value.trim()) {
      return 'ثبت نشده';
    }
    return value.trim();
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'فعال' : 'غیرفعال';
  }
}
