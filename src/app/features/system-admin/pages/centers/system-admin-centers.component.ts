import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterStatus } from '../../models/system-admin.models';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
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
    PersianDigitsPipe,
  ],
  templateUrl: './system-admin-centers.component.html',
  styleUrl: './system-admin-centers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCentersComponent {
  private readonly data = inject(SystemAdminDataService); readonly query = signal(''); readonly filter = signal<'all' | CenterStatus>('all'); readonly centers = this.data.centers;
  readonly filteredCenters = computed(() => this.centers().filter((center) => { const text = this.query().trim(); const matchesText = !text || `${center.name} ${center.managerName}`.includes(text); return matchesText && (this.filter() === 'all' || center.status === this.filter()); }));
  getStatusLabel(status: CenterStatus): string { return status === 'active' ? 'فعال' : status === 'pending' ? 'در انتظار تکمیل' : 'غیرفعال'; }
}
