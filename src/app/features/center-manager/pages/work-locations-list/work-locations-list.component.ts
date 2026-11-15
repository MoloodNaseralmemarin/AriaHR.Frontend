import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { WorkLocationService } from '../../services/work-location.service';
import { WorkLocationDto } from '../../models/work-location-response.dto';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { extractApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-work-locations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  templateUrl: './work-locations-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterManagerWorkLocationsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly workLocationService = inject(WorkLocationService);

  readonly workLocations = signal<WorkLocationDto[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadWorkLocations();
  }

  reload(): void {
    this.loadWorkLocations();
  }

  private loadWorkLocations(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.workLocationService.getWorkLocations().subscribe({
      next: (items) => {
        this.workLocations.set(items ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loadError.set(
          extractApiErrorMessage(err, 'دریافت لیست محل‌های کار با خطا مواجه شد.')
        );
      },
    });
  }

  /**
   * The backend exposes no DELETE for work locations; a location is retired by
   * setting `isActive` to false through the update endpoint.
   */
  toggleActive(item: WorkLocationDto): void {
    if (this.updatingId()) {
      return;
    }

    this.actionError.set(null);
    this.updatingId.set(item.id);

    this.workLocationService
      .updateWorkLocation(item.id, {
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        allowedRadiusInMeters: item.allowedRadiusInMeters,
        isActive: !item.isActive,
      })
      .pipe(finalize(() => this.updatingId.set(null)))
      .subscribe({
        next: (updated) => {
          this.workLocations.update((items) =>
            items.map((current) => (current.id === updated.id ? updated : current))
          );
        },
        error: (err) => {
          this.actionError.set(
            extractApiErrorMessage(err, 'تغییر وضعیت محل کار با خطا مواجه شد.')
          );
        },
      });
  }

  qrModeLabel(mode: string): string {
    return mode === 'Dynamic' ? 'پویا' : 'ثابت';
  }

  navigateToCreate(): void {
    this.router.navigate(['/center-manager/work-locations/create']);
  }
}

export { CenterManagerWorkLocationsListComponent as WorkLocationsListComponent };
