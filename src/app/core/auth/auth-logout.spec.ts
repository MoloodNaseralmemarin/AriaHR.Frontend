import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { SystemAdminSettingsComponent } from '../../features/system-admin/pages/settings/system-admin-settings.component';
import { AuthService, LogoutResponse } from './auth.service';
import { authGuard } from './auth.guard';

describe('Logout Flow & AuthGuard', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SystemAdminSettingsComponent],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: SystemAdminSettingsComponent },
          { path: 'system-admin/settings', component: SystemAdminSettingsComponent, canActivate: [authGuard] },
        ]),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('logout() sends POST request to /api/auth/logout, clears token and user signals, clears localStorage, and navigates to /login', () => {
    authService.saveAuthentication('sample_jwt_token', 'sample_refresh_token', { id: '1', fullName: 'مدیر سیستم' });
    expect(authService.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('aria_hr_access_token')).toBe('sample_jwt_token');

    authService.logout().subscribe((res: LogoutResponse) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('https://localhost:7151/api/auth/logout');
    expect(req.request.method).toBe('POST');

    req.flush({});

    expect(authService.token()).toBeNull();
    expect(authService.currentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('aria_hr_access_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('logout() clears session and redirects even if API returns an error', () => {
    authService.saveAuthentication('sample_jwt_token', 'sample_refresh_token', { id: '1', fullName: 'مدیر سیستم' });

    let logoutRes: LogoutResponse | undefined;
    authService.logout().subscribe((res: LogoutResponse) => {
      logoutRes = res;
    });

    const req = httpMock.expectOne('https://localhost:7151/api/auth/logout');
    req.flush({ message: 'خروج از حساب کاربری انجام نشد. لطفاً دوباره تلاش کنید.' }, { status: 500, statusText: 'Internal Server Error' });

    expect(logoutRes?.success).toBe(false);
    expect(logoutRes?.message).toBe('خروج از حساب کاربری انجام نشد. لطفاً دوباره تلاش کنید.');

    expect(authService.token()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('aria_hr_access_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('authGuard blocks unauthenticated users and redirects to /login', () => {
    authService.clearSession();
    expect(authService.isAuthenticated()).toBe(false);

    const guardResult = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(guardResult.toString()).toContain('/login');
  });

  it('authGuard allows authenticated users', () => {
    authService.saveAuthentication('valid_token');
    expect(authService.isAuthenticated()).toBe(true);

    const guardResult = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(guardResult).toBe(true);
  });

  it('SystemAdminSettingsComponent opens confirm modal and triggers logout on confirmation', () => {
    authService.saveAuthentication('valid_token');
    const fixture = TestBed.createComponent(SystemAdminSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.showLogoutConfirm()).toBe(false);

    // Open confirm dialog
    const logoutBtn = fixture.nativeElement.querySelector('.logout-btn');
    logoutBtn.click();
    fixture.detectChanges();

    expect(component.showLogoutConfirm()).toBe(true);

    // Click confirm logout button in modal
    component.onConfirmLogout();

    const req = httpMock.expectOne('https://localhost:7151/api/auth/logout');
    req.flush({});

    expect(component.showLogoutConfirm()).toBe(false);
    expect(authService.isAuthenticated()).toBe(false);
  });
});
