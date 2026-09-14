import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthUserDto, CurrentUserDto } from '../../../../core/auth/auth.models';

describe('Center Manager DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const sampleUser: CurrentUserDto = {
    id: '12345678-1234-1234-1234-1234567890ab',
    firstName: 'محمد',
    lastName: 'رضایی',
    phoneNumber: '09123456789',
    roles: ['CenterManager'],
    organizationId: '87654321-4321-4321-4321-ba0987654321',
  };

  const userDetailsSignal = signal<CurrentUserDto | null>(null);
  const currentUserSignal = signal<AuthUserDto | null>(null);

  const mockAuthService = {
    userDetails: userDetailsSignal,
    currentUser: currentUserSignal,
    getCurrentUser: vi.fn(),
  };

  beforeEach(async () => {
    userDetailsSignal.set(null);
    currentUserSignal.set(null);
    mockAuthService.getCurrentUser = vi.fn().mockReturnValue(of(sampleUser));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create component and call authService.getCurrentUser on init', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should display full name from userDetails without hardcoded prefixes', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    userDetailsSignal.set(sampleUser);
    fixture.detectChanges();

    expect(component.managerName).toBe('محمد رضایی');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('سلام، محمد رضایی 👋');
  });

  it('should fallback to currentUser fullName if userDetails is null', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    userDetailsSignal.set(null);
    currentUserSignal.set({
      fullName: 'علی محمدی',
    });
    fixture.detectChanges();

    expect(component.managerName).toBe('علی محمدی');
  });

  it('should fallback to neutral string if no user info is available', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    userDetailsSignal.set(null);
    currentUserSignal.set(null);
    fixture.detectChanges();

    expect(component.managerName).toBe('مدیر مرکز');
  });

  it('should handle error from getCurrentUser gracefully', () => {
    mockAuthService.getCurrentUser = vi.fn().mockReturnValue(throwError(() => new Error('API error')));
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.managerName).toBe('مدیر مرکز');
  });
});
