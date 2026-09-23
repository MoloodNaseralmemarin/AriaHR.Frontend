import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { CreateWorkLocationComponent } from './create-work-location.component';
import { WorkLocationService } from '../../services/work-location.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';

describe('CreateWorkLocationComponent', () => {
  let component: CreateWorkLocationComponent;
  let fixture: ComponentFixture<CreateWorkLocationComponent>;

  let mockWorkLocationService: Partial<WorkLocationService>;
  let mockAuthService: Partial<AuthService>;

  const mockUserDetails: CurrentUserDto = {
    id: 'user-1',
    firstName: 'علی',
    lastName: 'رضایی',
    phoneNumber: '09123456789',
    roles: ['CenterManager'],
    organizationId: 'org-123',
  };

  const userDetailsSignal = signal<CurrentUserDto | null>(mockUserDetails);

  beforeEach(async () => {
    mockWorkLocationService = {
      createWorkLocation: vi.fn().mockReturnValue(
        of({
          id: 'wl-1',
          organizationId: 'org-123',
          latitude: 35.7219,
          longitude: 51.3347,
          radiusInMeters: 200,
          isActive: true,
        })
      ),
      reverseGeocode: vi.fn().mockReturnValue(of('تهران، خیابان ولیعصر')),
    };

    userDetailsSignal.set(mockUserDetails);

    mockAuthService = {
      userDetails: userDetailsSignal,
      getCurrentUser: vi.fn().mockReturnValue(of(mockUserDetails)),
    };

    await TestBed.configureTestingModule({
      imports: [CreateWorkLocationComponent],
      providers: [
        provideRouter([]),
        { provide: WorkLocationService, useValue: mockWorkLocationService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateWorkLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and initialize default form values', () => {
    expect(component).toBeTruthy();
    expect(component.form.controls.radiusInMeters.value).toBe(200);
    expect(component.form.controls.isActive.value).toBe(true);
    expect(component.selectedLocation()).toBeNull();
  });

  it('should validate radius control correctly', () => {
    const radiusCtrl = component.form.controls.radiusInMeters;

    radiusCtrl.setValue(0);
    expect(radiusCtrl.invalid).toBe(true);

    radiusCtrl.setValue(-10);
    expect(radiusCtrl.invalid).toBe(true);

    radiusCtrl.setValue(150);
    expect(radiusCtrl.valid).toBe(true);
  });

  it('should update selected location and trigger reverse geocoding on selectLocation', () => {
    component.selectLocation(35.7219, 51.3347);

    expect(component.selectedLocation()).toEqual({ lat: 35.7219, lng: 51.3347 });
    expect(mockWorkLocationService.reverseGeocode).toHaveBeenCalledWith(35.7219, 51.3347);
    expect(component.resolvedAddress()).toBe('تهران، خیابان ولیعصر');
  });

  it('should require selecting a location before submission', () => {
    component.onSubmit();

    expect(component.errorMessage()).toBe('لطفاً ابتدا محل مرکز را روی نقشه انتخاب کنید.');
    expect(mockWorkLocationService.createWorkLocation).not.toHaveBeenCalled();
  });

  it('should prevent submission if user has no organizationId', () => {
    userDetailsSignal.set({
      ...mockUserDetails,
      organizationId: null,
    });

    component.selectLocation(35.7219, 51.3347);
    component.onSubmit();

    expect(component.errorMessage()).toBe('شما به هیچ مرکزی متصل نیستید و امکان ثبت محل کار را ندارید.');
    expect(mockWorkLocationService.createWorkLocation).not.toHaveBeenCalled();
  });

  it('should submit valid work location successfully and show success toast', () => {
    component.selectLocation(35.7219, 51.3347);
    component.onSubmit();

    expect(mockWorkLocationService.createWorkLocation).toHaveBeenCalledWith({
      organizationId: 'org-123',
      latitude: 35.7219,
      longitude: 51.3347,
      radiusInMeters: 200,
      isActive: true,
    });
    expect(component.showSuccessToast()).toBe(true);
    expect(component.submitState()).toBe('success');
  });

  it('should handle API errors during submission gracefully', () => {
    vi.mocked(mockWorkLocationService.createWorkLocation!).mockReturnValue(
      throwError(() => ({ error: { message: 'محل کار تکراری است.' } }))
    );

    component.selectLocation(35.7219, 51.3347);
    component.onSubmit();

    expect(component.submitState()).toBe('error');
    expect(component.errorMessage()).toBe('محل کار تکراری است.');
    expect(component.showSuccessToast()).toBe(false);
  });
});
