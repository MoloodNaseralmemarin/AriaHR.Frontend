import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { DashboardService } from './dashboard.service';
import { DashboardOverviewResponse } from '../models/dashboard-overview.dto';

describe('DashboardService (Isolated Tests)', () => {
  let service: DashboardService;
  let mockHttpClient: { get: any };

  const mockOverview: DashboardOverviewResponse = {
    centers: {
      totalCount: 5,
      activeCount: 4,
      awaitingCompletionCount: 1,
    },
    centerManagers: {
      totalCount: 3,
    },
    employees: {
      totalCount: 42,
      createdThisMonth: 7,
    },
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of(mockOverview)),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: DashboardService, useClass: DashboardService, deps: [] },
      ],
    });

    runInInjectionContext(injector, () => {
      service = injector.get(DashboardService);
    });
  });

  it('should fetch overview data via GET /api/dashboard/overview', () => {
    service.getOverview().subscribe((data) => {
      expect(data).toEqual(mockOverview);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/api/dashboard/overview'));
  });
});
