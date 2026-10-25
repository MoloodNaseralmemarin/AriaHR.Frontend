import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { SidebarNavComponent } from './sidebar-nav.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';

describe('SidebarNavComponent (isolated)', () => {
  let component: SidebarNavComponent;
  let userDetailsSignal: ReturnType<typeof signal<CurrentUserDto | null>>;
  let currentUserSignal: ReturnType<typeof signal<any>>;
  let mockAuthService: {
    userDetails: ReturnType<typeof signal<CurrentUserDto | null>>;
    currentUser: ReturnType<typeof signal<any>>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    userDetailsSignal = signal<CurrentUserDto | null>(null);
    currentUserSignal = signal<any>(null);

    mockAuthService = {
      userDetails: userDetailsSignal,
      currentUser: currentUserSignal,
      getCurrentUser: vi.fn().mockReturnValue(of(null)),
      logout: vi.fn(),
    };

    const injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    runInInjectionContext(injector, () => {
      component = new SidebarNavComponent();
    });
  });

  it('should create component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.getCurrentUser on init if userDetails is null', () => {
    component.ngOnInit();
    expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should NOT call authService.getCurrentUser on init if userDetails already exists', () => {
    userDetailsSignal.set({
      id: 'usr-1',
      firstName: 'علي',
      lastName: 'رضايي',
      phoneNumber: '09123456789',
      roles: ['CenterManager'],
      organizationId: 'org-1',
      organizationName: 'کلینیک سینا',
    });

    component.ngOnInit();
    expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should compute organizationName and manager full name when available', () => {
    userDetailsSignal.set({
      id: 'usr-1',
      firstName: 'علي',
      lastName: 'رضايي',
      phoneNumber: '09123456789',
      roles: ['CenterManager'],
      organizationId: 'org-1',
      organizationName: 'کلینیک پارس',
    });

    expect(component.managerName).toBe('علي رضايي');
    expect(component.centerName).toBe('کلینیک پارس');
    expect(component.avatarInitials).toBe('ع‌ر');
  });

  it('should compute "تعیین نشده" when organizationName is null, empty or whitespace', () => {
    userDetailsSignal.set({
      id: 'usr-1',
      firstName: 'رضا',
      lastName: 'کمالی',
      phoneNumber: '09123456789',
      roles: ['CenterManager'],
      organizationId: null,
      organizationName: '   ',
    });

    expect(component.centerName).toBe('تعیین نشده');
  });

  it('should fall back to "مدیر مرکز" and "م‌ک" initials if manager name is missing', () => {
    userDetailsSignal.set({
      id: 'usr-1',
      firstName: '',
      lastName: '',
      phoneNumber: '09123456789',
      roles: ['CenterManager'],
      organizationId: 'org-1',
      organizationName: 'درمانگاه آریا',
    });

    expect(component.managerName).toBe('مدیر مرکز');
    expect(component.avatarInitials).toBe('م‌ک');
  });

  it('should handle API error gracefully when loading user details fails', () => {
    mockAuthService.getCurrentUser.mockReturnValue(throwError(() => new Error('API Error')));
    component.ngOnInit();

    expect(component.managerName).toBe('مدیر مرکز');
    expect(component.centerName).toBe('تعیین نشده');
  });

  it('should call authService.logout on onLogout', () => {
    component.onLogout();
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });
});
