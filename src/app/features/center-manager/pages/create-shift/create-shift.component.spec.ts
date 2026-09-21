import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateShiftComponent } from './create-shift.component';
import { ShiftService } from '../../services/shift.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CurrentUserDto } from '../../../../core/auth/auth.models';

describe('CreateShiftComponent', () => {
  let component: CreateShiftComponent;
  let fixture: ComponentFixture<CreateShiftComponent>;
  let mockShiftService: { createShift: ReturnType<typeof vi.fn> };
  let mockAuthService: {
    userDetails: ReturnType<typeof signal<CurrentUserDto | null>>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockUser: CurrentUserDto = {
    id: 'user-1',
    firstName: 'احمد',
    lastName: 'محمدی',
    phoneNumber: '09121111111',
    roles: ['CenterManager'],
    organizationId: 'org-12345',
  };

  beforeEach(() => {
    mockShiftService = {
      createShift: vi.fn(),
    };

    mockAuthService = {
      userDetails: signal<CurrentUserDto | null>(mockUser),
      getCurrentUser: vi.fn().mockReturnValue(of(mockUser)),
    };

    TestBed.configureTestingModule({
      imports: [CreateShiftComponent],
      providers: [
        provideRouter([]),
        { provide: ShiftService, useValue: mockShiftService },
        { provide: AuthService, useValue: mockAuthService },
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

  it('should detect timeRangeInvalid when startTime equals endTime', () => {
    component.form.patchValue({
      name: 'شیفت صبح',
      startTime: '08:00',
      endTime: '08:00',
      isActive: true,
    });
    expect(component.timeRangeInvalid()).toBe(true);

    component.onSubmit();
    expect(mockShiftService.createShift).not.toHaveBeenCalled();
  });

  it('should allow overnight shift when endTime is earlier in 24h cycle than startTime', () => {
    mockShiftService.createShift.mockReturnValue(
      of({
        id: 'shift-night',
        name: 'شیفت شب',
        startTime: '22:00',
        endTime: '06:00',
        isActive: true,
      })
    );

    component.form.patchValue({
      name: 'شیفت شب',
      startTime: '22:00',
      endTime: '06:00',
      isActive: true,
    });

    expect(component.timeRangeInvalid()).toBe(false);

    component.onSubmit();

    expect(mockShiftService.createShift).toHaveBeenCalledWith({
      name: 'شیفت شب',
      startTime: '22:00',
      endTime: '06:00',
      isActive: true,
      organizationId: 'org-12345',
    });
  });

  it('should prevent submission and show exact Persian error when organizationId is missing', () => {
    mockAuthService.userDetails.set({
      ...mockUser,
      organizationId: null,
    });

    component.form.patchValue({
      name: 'شیفت روز',
      startTime: '08:00',
      endTime: '16:00',
      isActive: true,
    });

    component.onSubmit();

    expect(mockShiftService.createShift).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe(
      'شما به هیچ مرکزی متصل نیستید و امکان ثبت شیفت را ندارید.'
    );
  });

  it('should normalize Persian digits and include authenticated organizationId in submission payload', () => {
    mockShiftService.createShift.mockReturnValue(
      of({
        id: 'shift-1',
        name: 'شیفت صبح',
        startTime: '08:00',
        endTime: '16:00',
        isActive: true,
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
      organizationId: 'org-12345',
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
