import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CreateShiftComponent, normalizeTimeString } from './create-shift.component';
import { ShiftService } from '../../services/shift.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('CreateShiftComponent (Isolated Unit Tests)', () => {
  const mockShiftService = {
    createShift: vi.fn(),
  };

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({ organizationId: 'org-123' }),
    getCurrentUser: vi.fn().mockReturnValue(of({ organizationId: 'org-123' })),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  function createComponent(): CreateShiftComponent {
    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NonNullableFormBuilder, useValue: new FormBuilder().nonNullable },
        { provide: ShiftService, useValue: mockShiftService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    return runInInjectionContext(injector, () => new CreateShiftComponent());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizeTimeString should convert Persian digits to ASCII and format as HH:mm', () => {
    expect(normalizeTimeString('۰۸:۳۰')).toBe('08:30');
    expect(normalizeTimeString('14:5')).toBe('14:05');
    expect(normalizeTimeString('۹:۰')).toBe('09:00');
  });

  it('timeRangeInvalid should return true when start and end times are identical', () => {
    const comp = createComponent();
    comp.form.controls.startTime.setValue('08:00');
    comp.form.controls.endTime.setValue('08:00');

    expect(comp.timeRangeInvalid()).toBe(true);
  });

  it('timeRangeInvalid should return false for overnight shifts', () => {
    const comp = createComponent();
    comp.form.controls.startTime.setValue('22:00');
    comp.form.controls.endTime.setValue('06:00');

    expect(comp.timeRangeInvalid()).toBe(false);
  });

  it('onSubmit should submit valid shift and navigate to /center-manager/shifts', () => {
    mockShiftService.createShift.mockReturnValue(of({ id: 'shift-99', name: 'شیفت صبح' }));
    const comp = createComponent();

    comp.form.controls.name.setValue('شیفت صبح');
    comp.form.controls.startTime.setValue('۰۸:۰۰');
    comp.form.controls.endTime.setValue('۱۶:۰۰');
    comp.form.controls.isActive.setValue(true);

    comp.onSubmit();

    expect(mockShiftService.createShift).toHaveBeenCalledWith({
      name: 'شیفت صبح',
      startTime: '08:00',
      endTime: '16:00',
      isActive: true,
      organizationId: 'org-123',
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/center-manager/shifts']);
  });

  it('onSubmit should handle server error gracefully', () => {
    mockShiftService.createShift.mockReturnValue(
      throwError(() => ({ error: { message: 'خطای سرور' } }))
    );
    const comp = createComponent();

    comp.form.controls.name.setValue('شیفت شب');
    comp.form.controls.startTime.setValue('22:00');
    comp.form.controls.endTime.setValue('06:00');

    comp.onSubmit();

    expect(comp.errorMessage()).toBe('خطای سرور');
  });
});
