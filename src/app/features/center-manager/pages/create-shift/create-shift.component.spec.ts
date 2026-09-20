import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateShiftComponent } from './create-shift.component';
import { ShiftService } from '../../services/shift.service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('CreateShiftComponent', () => {
  let component: CreateShiftComponent;
  let fixture: ComponentFixture<CreateShiftComponent>;
  let mockShiftService: { createShift: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    mockShiftService = {
      createShift: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [CreateShiftComponent],
      providers: [
        provideRouter([]),
        { provide: ShiftService, useValue: mockShiftService },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(CreateShiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate form when empty and submitted', () => {
    component.onSubmit();
    expect(component.form.invalid).toBe(true);
    expect(mockShiftService.createShift).not.toHaveBeenCalled();
  });

  it('should detect timeRangeInvalid when startTime is after endTime', () => {
    component.form.patchValue({
      name: 'شیفت صبح',
      startTime: '16:00',
      endTime: '08:00',
      isActive: true,
    });
    expect(component.timeRangeInvalid()).toBe(true);

    component.onSubmit();
    expect(mockShiftService.createShift).not.toHaveBeenCalled();
  });

  it('should normalize Persian digits and call shiftService.createShift on valid submission', () => {
    mockShiftService.createShift.mockReturnValue(
      of({
        id: 'shift-1',
        employeeId: 'emp-1',
        employeeName: 'علی رضایی',
        shiftDate: '2026-09-20',
        startTime: '08:00',
        endTime: '16:00',
        status: 'scheduled',
      })
    );

    // Using Persian digits for 08:00 and 16:00: \u06F0\u06F8:\u06F0\u06F0 and \u06F1\u06F6:\u06F0\u06F0
    component.form.patchValue({
      name: 'شیفت صبح',
      startTime: '\u06F0\u06F8:\u06F0\u06F0',
      endTime: '\u06F1\u06F6:\u06F0\u06F0',
      isActive: true,
    });

    component.onSubmit();

    expect(mockShiftService.createShift).toHaveBeenCalledWith({
      name: 'شیفت صبح',
      startTime: '08:00',
      endTime: '16:00',
      isActive: true,
    });

    expect(component.showSuccessToast()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/center-manager/shifts']);
  });

  it('should handle error when shift creation fails', () => {
    mockShiftService.createShift.mockReturnValue(
      throwError(() => ({ error: { message: 'خطای سرور' } }))
    );

    component.form.patchValue({
      name: 'شیفت عصر',
      startTime: '16:00',
      endTime: '23:00',
      isActive: true,
    });

    component.onSubmit();

    expect(component.submitState()).toBe('error');
    expect(component.errorMessage()).toBe('خطای سرور');
  });
});
