import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OrganizationService } from '../../../organizations/services/organization.service';
import { CenterResponseDto } from '../../../organizations/models/center-response.dto';
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
  readonly center = signal<CenterResponseDto | null>(null);

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
        const message =
          err?.error?.message ||
          err?.message ||
          'خطایی در دریافت اطلاعات مرکز رخ داد. لطفاً مجدداً تلاش کنید.';
        this.error.set(message);
        this.loading.set(false);
      },
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
