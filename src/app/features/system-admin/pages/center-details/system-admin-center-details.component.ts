import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterStatus } from '../../models/system-admin.models';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-system-admin-center-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './system-admin-center-details.component.html',
  styleUrl: './system-admin-center-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCenterDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(SystemAdminDataService);

  readonly center =
    this.data.getCenterById(this.route.snapshot.paramMap.get('id') ?? '') ??
    this.data.centers()[0];

  getStatusLabel(status: CenterStatus): string {
    return status === 'active'
      ? 'فعال'
      : status === 'pending'
      ? 'در انتظار تکمیل'
      : 'غیرفعال';
  }
}
