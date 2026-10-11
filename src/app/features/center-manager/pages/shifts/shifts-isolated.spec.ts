import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { ShiftsComponent } from './shifts.component';
import { ShiftService } from '../../services/shift.service';
import { ShiftDto } from '../../models/shift.dto';

describe('ShiftsComponent (Isolated Unit Tests)', () => {
  const mockShiftService = {
    getShifts: vi.fn(),
    activateShift: vi.fn(),
    deactivateShift: vi.fn(),
    updateShift: vi.fn(),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

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
      name: 'شیفت شب',
      startTime: '22:00',
      endTime: '06:00',
      isActive: false,
      organizationId: 'org-100',
    },
  ];

  function createComponent(): ShiftsComponent {
    const injector = Injector.create({
      providers: [
        { provide: ShiftService, useValue: mockShiftService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    return runInInjectionContext(injector, () => new ShiftsComponent());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ngOnInit() should load shifts from ShiftService', () => {
    mockShiftService.getShifts.mockReturnValue(of(dummyShifts));
    const comp = createComponent();

    comp.ngOnInit();

    expect(comp.shifts()).toEqual(dummyShifts);
    expect(comp.isLoading()).toBe(false);
    expect(comp.errorMessage()).toBeNull();
  });

  it('loadShifts() should handle error gracefully', () => {
    mockShiftService.getShifts.mockReturnValue(throwError(() => ({ error: { message: 'Failed to load' } })));
    const comp = createComponent();

    comp.loadShifts();

    expect(comp.isLoading()).toBe(false);
    expect(comp.errorMessage()).toBe('Failed to load');
  });

  it('toggleStatus() should deactivate an active shift', () => {
    mockShiftService.deactivateShift.mockReturnValue(of({ ...dummyShifts[0], isActive: false }));
    const comp = createComponent();
    comp.shifts.set(dummyShifts);

    comp.toggleStatus(dummyShifts[0]);

    expect(mockShiftService.deactivateShift).toHaveBeenCalledWith('shift-1');
    expect(comp.shifts().find((s) => s.id === 'shift-1')?.isActive).toBe(false);
  });

  it('toggleStatus() should activate an inactive shift', () => {
    mockShiftService.activateShift.mockReturnValue(of({ ...dummyShifts[1], isActive: true }));
    const comp = createComponent();
    comp.shifts.set(dummyShifts);

    comp.toggleStatus(dummyShifts[1]);

    expect(mockShiftService.activateShift).toHaveBeenCalledWith('shift-2');
    expect(comp.shifts().find((s) => s.id === 'shift-2')?.isActive).toBe(true);
  });

  it('onAddShift() should navigate to /center-manager/shifts/create', () => {
    const comp = createComponent();

    comp.onAddShift();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/center-manager/shifts/create']);
  });
});
