import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { ShiftService } from './shift.service';
import { ShiftDto } from '../models/shift.dto';
import { CreateShiftDto } from '../models/create-shift.dto';
import { UpdateShiftDto } from '../models/update-shift.dto';
import { environment } from '../../../../environments/environment';

describe('ShiftService (Isolated Unit Tests)', () => {
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  };

  const baseUrl = `${environment.apiUrl}/api/scheduling/shifts`;

  const dummyShifts: ShiftDto[] = [
    {
      id: 'shift-1',
      name: 'شیفت صبح',
      startTime: '08:00',
      endTime: '16:00',
      isActive: true,
      organizationId: 'org-100',
    },
    {
      id: 'shift-2',
      name: 'شیفت عصر',
      startTime: '16:00',
      endTime: '00:00',
      isActive: false,
      organizationId: 'org-100',
    },
  ];

  function createService(): ShiftService {
    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });

    return runInInjectionContext(injector, () => new ShiftService());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getShifts() should GET list of shifts from /api/scheduling/shifts', () => {
    mockHttpClient.get.mockReturnValue(of(dummyShifts));
    const service = createService();

    service.getShifts().subscribe((shifts) => {
      expect(shifts).toEqual(dummyShifts);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(baseUrl);
  });

  it('getShiftById() should GET shift by ID from /api/scheduling/shifts/{id}', () => {
    const dummy = dummyShifts[0];
    mockHttpClient.get.mockReturnValue(of(dummy));
    const service = createService();

    service.getShiftById('shift-1').subscribe((shift) => {
      expect(shift).toEqual(dummy);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${baseUrl}/shift-1`);
  });

  it('createShift() should POST CreateShiftDto to /api/scheduling/shifts', () => {
    const createDto: CreateShiftDto = {
      name: 'شیفت شب',
      startTime: '00:00',
      endTime: '08:00',
      isActive: true,
      organizationId: 'org-100',
    };
    const createdShift: ShiftDto = { id: 'shift-3', ...createDto };

    mockHttpClient.post.mockReturnValue(of(createdShift));
    const service = createService();

    service.createShift(createDto).subscribe((res) => {
      expect(res).toEqual(createdShift);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(baseUrl, createDto);
  });

  it('updateShift() should PUT UpdateShiftDto to /api/scheduling/shifts/{id}', () => {
    const updateDto: UpdateShiftDto = {
      name: 'شیفت صبح روزانه',
      startTime: '07:30',
      endTime: '15:30',
      isActive: true,
    };
    const updatedShift: ShiftDto = { id: 'shift-1', ...updateDto, organizationId: 'org-100' };

    mockHttpClient.put.mockReturnValue(of(updatedShift));
    const service = createService();

    service.updateShift('shift-1', updateDto).subscribe((res) => {
      expect(res).toEqual(updatedShift);
    });

    expect(mockHttpClient.put).toHaveBeenCalledWith(`${baseUrl}/shift-1`, updateDto);
  });

  it('activateShift() should PATCH /api/scheduling/shifts/{id}/activate with null body', () => {
    const activatedShift: ShiftDto = { ...dummyShifts[1], isActive: true };
    mockHttpClient.patch.mockReturnValue(of(activatedShift));
    const service = createService();

    service.activateShift('shift-2').subscribe((res) => {
      expect(res).toEqual(activatedShift);
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith(`${baseUrl}/shift-2/activate`, null);
  });

  it('deactivateShift() should PATCH /api/scheduling/shifts/{id}/deactivate with null body', () => {
    const deactivatedShift: ShiftDto = { ...dummyShifts[0], isActive: false };
    mockHttpClient.patch.mockReturnValue(of(deactivatedShift));
    const service = createService();

    service.deactivateShift('shift-1').subscribe((res) => {
      expect(res).toEqual(deactivatedShift);
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith(`${baseUrl}/shift-1/deactivate`, null);
  });
});
