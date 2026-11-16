import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CenterManagerWorkLocationsListComponent } from './work-locations-list.component';
import { WorkLocationService } from '../../services/work-location.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WorkLocationResponseDto } from '../../models/work-location-response.dto';

describe('CenterManagerWorkLocationsListComponent (Isolated Unit Tests)', () => {
  const locations: WorkLocationResponseDto[] = [
    {
      id: 'wl-1',
      organizationId: 'org-1',
      name: 'دفتر مرکزی',
      latitude: 35.7,
      longitude: 51.3,
      allowedRadiusInMeters: 200,
      isActive: true,
      qrCodeMode: 'Dynamic',
      qrCodeEnabled: true,
      qrRotationIntervalMinutes: 5,
      createdAtUtc: '2026-10-03T12:00:00Z',
    },
    {
      id: 'wl-2',
      organizationId: 'org-1',
      name: 'انبار غرب',
      latitude: 35.8,
      longitude: 51.4,
      allowedRadiusInMeters: 350,
      isActive: false,
      qrCodeMode: 'Static',
      qrCodeEnabled: false,
      qrRotationIntervalMinutes: 5,
      createdAtUtc: '2026-10-03T12:00:00Z',
    },
  ];

  const updateWorkLocation = vi.fn();
  const workLocationService = {
    getWorkLocations: vi.fn().mockReturnValue(of(locations)),
    updateWorkLocation,
  };
  const notificationService = { showSuccess: vi.fn() };
  const router = { navigate: vi.fn() };

  function createComponent(): CenterManagerWorkLocationsListComponent {
    const injector = Injector.create({
      providers: [
        { provide: WorkLocationService, useValue: workLocationService },
        { provide: NotificationService, useValue: notificationService },
        { provide: Router, useValue: router },
      ],
    });

    let comp!: CenterManagerWorkLocationsListComponent;
    runInInjectionContext(injector, () => {
      comp = new CenterManagerWorkLocationsListComponent();
    });
    comp.workLocations.set(locations);
    return comp;
  }

  beforeEach(() => {
    updateWorkLocation.mockReset();
    notificationService.showSuccess.mockClear();
    router.navigate.mockClear();
  });

  it('should filter by name and status', () => {
    const comp = createComponent();

    comp.searchTerm.set('انبار');
    expect(comp.filteredWorkLocations().map((item) => item.id)).toEqual(['wl-2']);

    comp.searchTerm.set('');
    comp.statusFilter.set('active');
    expect(comp.filteredWorkLocations().map((item) => item.id)).toEqual(['wl-1']);

    comp.statusFilter.set('inactive');
    expect(comp.filteredWorkLocations().map((item) => item.id)).toEqual(['wl-2']);

    comp.clearFilters();
    expect(comp.filteredWorkLocations()).toHaveLength(2);
    expect(comp.hasFilters()).toBe(false);
  });

  it('should label QR modes in Persian', () => {
    const comp = createComponent();

    expect(comp.qrLabel(locations[0])).toBe('QR پویا');
    expect(comp.qrLabel(locations[1])).toBe('QR غیرفعال');
  });

  it('should ask for confirmation before deactivating an active location', () => {
    updateWorkLocation.mockReturnValue(of({ ...locations[0], isActive: false }));
    const comp = createComponent();

    comp.requestStatusToggle(locations[0]);

    expect(comp.statusConfirmTarget()?.id).toBe('wl-1');
    expect(updateWorkLocation).not.toHaveBeenCalled();

    comp.confirmDeactivate();

    expect(updateWorkLocation).toHaveBeenCalledWith('wl-1', {
      name: 'دفتر مرکزی',
      latitude: 35.7,
      longitude: 51.3,
      allowedRadiusInMeters: 200,
      isActive: false,
    });
    expect(comp.workLocations()[0].isActive).toBe(false);
    expect(notificationService.showSuccess).toHaveBeenCalled();
  });

  it('should activate an inactive location immediately without a confirmation', () => {
    updateWorkLocation.mockReturnValue(of({ ...locations[1], isActive: true }));
    const comp = createComponent();

    comp.requestStatusToggle(locations[1]);

    expect(comp.statusConfirmTarget()).toBeNull();
    expect(updateWorkLocation).toHaveBeenCalledWith(
      'wl-2',
      expect.objectContaining({ isActive: true })
    );
  });
});
