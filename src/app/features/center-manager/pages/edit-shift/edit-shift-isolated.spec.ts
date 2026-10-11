import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EditShiftComponent } from './edit-shift.component';
import { ShiftService } from '../../services/shift.service';
import { ShiftDto } from '../../models/shift.dto';

describe('EditShiftComponent (Isolated Unit Tests)', () => {
  const mockShiftService = {
    getShiftById: vi.fn(),
    updateShift: vi.fn(),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  const dummyShift: ShiftDto = {
    id: 'shift-100',
    name: 'شیفت صبح',
    startTime: '08:00',
    endTime: '16:00',
    isActive: true,
    organizationId: 'org-1',
  };

  function createComponent(shiftIdParam: string | null = 'shift-100'): EditShiftComponent {
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => shiftIdParam,
        },
      },
      paramMap: of({
        get: (key: string) => shiftIdParam,
      }),
    };

    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NonNullableFormBuilder, useValue: new FormBuilder().nonNullable },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    return runInInjectionContext(injector, () => new EditShiftComponent());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ngOnInit() should fetch shift details and populate form', () => {
    mockShiftService.getShiftById.mockReturnValue(of(dummyShift));
    const comp = createComponent('shift-100');

    comp.ngOnInit();

    expect(mockShiftService.getShiftById).toHaveBeenCalledWith('shift-100');
    expect(comp.isLoading()).toBe(false);
    expect(comp.form.controls.name.value).toBe('شیفت صبح');
    expect(comp.form.controls.startTime.value).toBe('08:00');
    expect(comp.form.controls.endTime.value).toBe('16:00');
    expect(comp.form.controls.isActive.value).toBe(true);
  });

  it('ngOnInit() should handle missing route ID', () => {
    const comp = createComponent(null);

    comp.ngOnInit();

    expect(comp.isLoading()).toBe(false);
    expect(comp.loadError()).toBe('شناسه شیفت نامعتبر است.');
    expect(mockShiftService.getShiftById).not.toHaveBeenCalled();
  });

  it('onSubmit() should submit updated shift and navigate back to list', () => {
    mockShiftService.getShiftById.mockReturnValue(of(dummyShift));
    mockShiftService.updateShift.mockReturnValue(of({ ...dummyShift, name: 'شیفت صبح تغییر یافته' }));

    const comp = createComponent('shift-100');
    comp.ngOnInit();

    comp.form.controls.name.setValue('شیفت صبح تغییر یافته');
    comp.form.controls.startTime.setValue('۰۷:۳۰');
    comp.form.controls.endTime.setValue('۱۵:۳۰');

    comp.onSubmit();

    expect(mockShiftService.updateShift).toHaveBeenCalledWith('shift-100', {
      name: 'شیفت صبح تغییر یافته',
      startTime: '07:30',
      endTime: '15:30',
      isActive: true,
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/center-manager/shifts']);
  });

  it('onSubmit() should display server error when update fails', () => {
    mockShiftService.getShiftById.mockReturnValue(of(dummyShift));
    mockShiftService.updateShift.mockReturnValue(throwError(() => ({ error: { message: 'خطای بروزرسانی' } })));

    const comp = createComponent('shift-100');
    comp.ngOnInit();

    comp.onSubmit();

    expect(comp.errorMessage()).toBe('خطای بروزرسانی');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
