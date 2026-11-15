import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CurrentUserDto } from './auth.models';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';
import { SystemAdminDashboardComponent } from '../../features/system-admin/pages/dashboard/system-admin-dashboard.component';
import { SystemAdminDataService } from '../../features/system-admin/services/system-admin-data.service';

describe('Authenticated User Information Flow', () => {
  let authService: AuthService;
  let authApiService: AuthApiService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: CurrentUserDto = {
    id: '1f3aa1c6-4943-47ce-941e-e6288df133c2',
    firstName: 'مولود',
    lastName: 'ناصرالمعمارین',
    phoneNumber: '09376421351',
    roles: ['SystemAdmin'],
    organizationId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SystemAdminDashboardComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: class DummyComponent {} },
        ]),
        {
          provide: SystemAdminDataService,
          useValue: {
            stats: () => ({ totalCenters: 10, activeCenters: 8, totalManagers: 5, totalEmployees: 100, newCentersThisMonth: 2 }),
            getRecentCenters: () => [],
            getRecentActivity: () => [],
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    authApiService = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    authService.logout();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization Bearer header when token exists', () => {
    authService.saveAuthentication('my-test-jwt-token');

    authApiService.getCurrentUser().subscribe((res) => {
      expect(res).toEqual(mockUser);
    });

    const req = httpMock.expectOne('https://localhost:7151/api/auth/me');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-test-jwt-token');

    req.flush(mockUser);
  });

  it('should logout and redirect to /login when /api/auth/me returns 401 Unauthorized', () => {
    authService.saveAuthentication('expired-jwt-token');
    const navigateSpy = vi.spyOn(router, 'navigate');

    authService.getCurrentUser().subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne('https://localhost:7151/api/auth/me');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // The interceptor ends the session on 401; that best-effort notification is
    // expected and must be consumed so the test double has no open requests.
    httpMock.expectOne('https://localhost:7151/api/auth/logout').flush({});

    expect(authService.token()).toBeNull();
    expect(authService.userDetails()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should display First Name + Last Name in the dashboard greeting', () => {
    authService.saveAuthentication('valid-jwt-token');
    authService.userDetails.set(mockUser);

    const fixture: ComponentFixture<SystemAdminDashboardComponent> = TestBed.createComponent(
      SystemAdminDashboardComponent
    );
    fixture.detectChanges();

    httpMock.expectOne('https://localhost:7151/api/auth/me').flush(mockUser);
    httpMock.expectOne('https://localhost:7151/api/dashboard/overview').flush({
      centers: { totalCount: 10, activeCount: 8, awaitingCompletionCount: 2 },
      centerManagers: { totalCount: 5 },
      employees: { totalCount: 100, createdThisMonth: 4 },
    });
    httpMock.expectOne('https://localhost:7151/api/organizations/recent').flush([]);
    httpMock.expectOne('https://localhost:7151/api/dashboard/recent-activities').flush([]);
    fixture.detectChanges();

    const headerText: string = fixture.nativeElement.textContent;
    expect(headerText).toContain('سلام، مولود ناصرالمعمارین');
  });
});
