import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { parseApiError } from '../../../../core/http/api-error.util';
import { NotificationService } from '../../../../core/services/notification.service';
import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { UpdateWorkLocationDto } from '../../models/update-work-location.dto';
import { WorkLocationResponseDto } from '../../models/work-location-response.dto';
import { WorkLocationService } from '../../services/work-location.service';
import { qrModeLabel } from '../../utils/work-location-qr.util';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-work-locations-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DeleteConfirmationComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    SkeletonLoaderComponent,
    StatusBadgeComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './work-locations-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterManagerWorkLocationsListComponent implements OnInit {
  private readonly workLocationService = inject(WorkLocationService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly workLocations = signal<WorkLocationResponseDto[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly activeCount = computed(
    () => this.workLocations().filter((item) => item.isActive).length
  );
  readonly inactiveCount = computed(
    () => this.workLocations().filter((item) => !item.isActive).length
  );

  readonly filteredWorkLocations = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase('fa-IR');
    const filter = this.statusFilter();

    return this.workLocations().filter((item) => {
      const matchesStatus =
        filter === 'all' ||
        (filter === 'active' && item.isActive) ||
        (filter === 'inactive' && !item.isActive);
      const matchesTerm = !term || item.name.toLocaleLowerCase('fa-IR').includes(term);
      return matchesStatus && matchesTerm;
    });
  });

  readonly hasFilters = computed(
    () => !!this.searchTerm().trim() || this.statusFilter() !== 'all'
  );

  readonly statusConfirmTarget = signal<WorkLocationResponseDto | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly isConfirmBusy = computed(
    () => !!this.updatingId() && this.updatingId() === this.statusConfirmTarget()?.id
  );

  ngOnInit(): void {
    this.loadWorkLocations();
  }

  /** GET /api/WorkLocations/work-locations (organization resolved from the JWT). */
  loadWorkLocations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.workLocationService
      .getWorkLocations()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (items) => this.workLocations.set(items ?? []),
        error: (error) => {
          this.workLocations.set([]);
          this.errorMessage.set(parseApiError(error).message);
        },
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
  }

  navigateToCreate(): void {
    this.router.navigate(['/center-manager/work-locations/create']);
  }

  qrLabel(item: WorkLocationResponseDto): string {
    if (!item.qrCodeEnabled) {
      return 'QR غیرفعال';
    }
    return `QR ${qrModeLabel(item.qrCodeMode)}`;
  }

  /** Activation is safe and immediate; deactivation asks for confirmation. */
  requestStatusToggle(item: WorkLocationResponseDto): void {
    if (this.updatingId()) {
      return;
    }

    if (item.isActive) {
      this.statusConfirmTarget.set(item);
      return;
    }

    this.updateStatus(item, true);
  }

  confirmDeactivate(): void {
    const target = this.statusConfirmTarget();
    if (target) {
      this.updateStatus(target, false);
    }
  }

  cancelDeactivate(): void {
    if (!this.updatingId()) {
      this.statusConfirmTarget.set(null);
    }
  }

  private updateStatus(item: WorkLocationResponseDto, isActive: boolean): void {
    const request: UpdateWorkLocationDto = {
      name: item.name,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      allowedRadiusInMeters: Number(item.allowedRadiusInMeters),
      isActive,
    };

    this.actionError.set(null);
    this.updatingId.set(item.id);

    this.workLocationService
      .updateWorkLocation(item.id, request)
      .pipe(finalize(() => this.updatingId.set(null)))
      .subscribe({
        next: (updated) => {
          this.workLocations.update((items) =>
            items.map((current) => (current.id === updated.id ? updated : current))
          );
          this.statusConfirmTarget.set(null);
          this.notificationService.showSuccess(
            isActive ? 'محل کار فعال شد.' : 'محل کار غیرفعال شد.'
          );
        },
        error: (error) => {
          this.actionError.set(parseApiError(error).message);
          this.statusConfirmTarget.set(null);
        },
      });
  }
}

export { CenterManagerWorkLocationsListComponent as WorkLocationsListComponent };
