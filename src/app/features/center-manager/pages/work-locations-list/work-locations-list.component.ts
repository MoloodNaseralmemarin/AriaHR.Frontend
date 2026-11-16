import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { WorkLocationService } from '../../services/work-location.service';
import { WorkLocationResponseDto } from '../../models/work-location-response.dto';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { parseApiError } from '../../../../core/http/api-error.util';

@Component({
  selector: 'app-work-locations-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    StatusBadgeComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './work-locations-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterManagerWorkLocationsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly workLocationService = inject(WorkLocationService);

  readonly workLocations = signal<WorkLocationResponseDto[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadWorkLocations();
  }

  /** GET /api/organizations/work-locations (organization resolved from the JWT). */
  loadWorkLocations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.workLocationService
      .getWorkLocations()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (items) => this.workLocations.set(items ?? []),
        error: (err) => {
          this.workLocations.set([]);
          this.errorMessage.set(parseApiError(err).message);
        },
      });
  }

  navigateToCreate(): void {
    this.router.navigate(['/center-manager/work-locations/create']);
  }
}

export { CenterManagerWorkLocationsListComponent as WorkLocationsListComponent };
