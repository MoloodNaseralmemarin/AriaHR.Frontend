import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { CenterStatus } from '../../models/system-admin.models';

@Component({ selector: 'app-system-admin-centers', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './system-admin-centers.component.html', styleUrl: './system-admin-centers.component.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class SystemAdminCentersComponent {
  private readonly data = inject(SystemAdminDataService); readonly query = signal(''); readonly filter = signal<'all' | CenterStatus>('all'); readonly centers = this.data.centers;
  readonly filteredCenters = computed(() => this.centers().filter((center) => { const text = this.query().trim(); const matchesText = !text || `${center.name} ${center.managerName}`.includes(text); return matchesText && (this.filter() === 'all' || center.status === this.filter()); }));
  getStatusLabel(status: CenterStatus): string { return status === 'active' ? 'فعال' : status === 'pending' ? 'در انتظار تکمیل' : 'غیرفعال'; }
}
