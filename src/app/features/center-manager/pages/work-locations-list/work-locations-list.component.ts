import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { RouterLink } from '@angular/router';
import { WorkLocationService } from '../../services/work-location.service';
import { WorkLocationResponseDto } from '../../models/work-location-response.dto';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation.component';
import { environment } from '../../../../../environments/environment';

export interface WorkLocationTableItem {
  id: string;
  organizationId: string;
  latitude: number;
  longitude: number;
  radiusInMeters: number;
  isActive: boolean;
  createdAtUtc?: string;
  createdByUserId?: string | null;
}

@Component({
  selector: 'app-work-locations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  templateUrl: './work-locations-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterManagerWorkLocationsListComponent {
  private readonly router = inject(Router);
  private readonly workLocationService = inject(WorkLocationService);

  readonly workLocations = signal<WorkLocationTableItem[]>([]);
  readonly isLoading = signal(true);
  readonly showDeleteConfirmation = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deleteSuccess = signal(false);

  ngOnInit(): void {
    this.loadWorkLocations();
  }

  private loadWorkLocations(): void {
    this.isLoading.set(true);

    this.workLocationService.getWorkLocations().subscribe({
      next: (items) => {
        this.workLocations.set(
          items.map((item) => ({
            id: item.id || '',
            organizationId: item.organizationId || '',
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            radiusInMeters: item.radiusInMeters ?? 0,
            isActive: item.isActive ?? false,
            createdAtUtc: item.createdAtUtc,
            createdByUserId: item.createdByUserId,
          }))
        );
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load work locations:', err);
        this.isLoading.set(false);
      },
    });
  }

  onDelete(id: string): void {
    this.deletingId.set(id);
    this.showDeleteConfirmation.set(true);
  }

  confirmDelete(): void {
    const id = this.deletingId();
    if (!id) {
      this.showDeleteConfirmation.set(false);
      return;
    }

    this.deleteError.set(null);
    this.workLocationService.deleteWorkLocation(id).subscribe({
      next: () => {
        this.workLocations.update((items) => items.filter((item) => item.id !== id));
        this.deleteSuccess.set(true);
        this.showDeleteConfirmation.set(false);
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message || 'حذف محل کار با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
        );
        this.showDeleteConfirmation.set(false);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirmation.set(false);
    this.deletingId.set(null);
  }

  navigateToCreate(): void {
    this.router.navigate(['/center-manager/work-locations/create']);
  }
}

export { CenterManagerWorkLocationsListComponent as WorkLocationsListComponent };