import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateShiftComponent } from './create-shift.component';
import { ShiftService } from '../../services/shift.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('CreateShiftComponent', () => {
  let component: CreateShiftComponent;
  let fixture: ComponentFixture<CreateShiftComponent>;
  let mockShiftService: { createShift: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockShiftService = {
      createShift: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CreateShiftComponent],
      providers: [
        provideRouter([]),
        { provide: ShiftService, useValue: mockShiftService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateShiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate form when empty and submitted', () => {
    component.onSubmit();
    expect(component.form.invalid).toBe(true);
    expect(mockShiftService.createShift).not.toHaveBeenCalled();
  });

  it('should detect timeRangeInvalid when startTime is after endTime', () => {
    component.form.patchValue({
      employeeId: 'emp-1',
      shiftName: 'شیفت صبح',
      startTime: '16:00',
      endTime: '08:00',
    });
    expect(component.timeRangeInvalid()).toBe(true);

    component.onSubmit();
    expect(mockShiftService.createShift).not.toHaveBeenCalled();
  });

  it('should call shiftService.createShift on valid form submission and handle success', () => {
    mockShiftService.createShift.mockReturnValue(
      of({
        id: 'shift-1',
        employeeId: 'emp-1',
        employeeName: 'زهرا احمدی',
        shiftName: 'شیفت صبح',
        startTime: '08:00',
        endTime: '16:00',
        status: 'scheduled',
      })
    );

    component.form.patchValue({
      employeeId: 'emp-1',
      shiftName: 'شیفت صبح',
      startTime: '08:00',
      endTime: '16:00',
      notes: 'تست شیفت',
    });

    component.onSubmit();

    expect(mockShiftService.createShift).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      shiftName: 'شیفت صبح',
      startTime: '08:00',
      endTime: '16:00',
      notes: 'تست شیفت',
    });

    expect(component.isSuccess()).toBe(true);
  });

  it('should handle error when shift creation fails', () => {
    mockShiftService.createShift.mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    component.form.patchValue({
      employeeId: 'emp-1',
      shiftName: 'شیفت صبح',
      startTime: '08:00',
      endTime: '16:00',
    });

    component.onSubmit();

    expect(component.submitState()).toBe('error');
    expect(component.errorMessage()).toBe('ثبت شیفت با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
  });
});
