import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';

import { SystemAdminManagersComponent } from './system-admin-managers.component';
import { SystemAdminDataService } from '../../services/system-admin-data.service';

describe('SystemAdminManagersComponent (Isolated Tests)', () => {
  let component: SystemAdminManagersComponent;
  let mockDataService: any;

  const mockManagers = [
    { id: '1', name: 'علی رضایی', centerName: 'مرکز تهران', mobileNumber: '09121112233', active: true },
    { id: '2', name: 'مریم احمدی', centerName: 'مرکز شیراز', mobileNumber: '09173334455', active: false },
  ];

  beforeEach(() => {
    mockDataService = {
      managers: signal(mockManagers),
    };

    const injector = Injector.create({
      providers: [
        { provide: SystemAdminDataService, useValue: mockDataService },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new SystemAdminManagersComponent();
    });
  });

  it('should list all managers initially', () => {
    expect(component.filteredManagers().length).toBe(2);
  });

  it('should filter managers by search term', () => {
    component.onSearchInput('رضایی');
    expect(component.filteredManagers().length).toBe(1);
    expect(component.filteredManagers()[0].name).toBe('علی رضایی');
  });

  it('should filter managers by status', () => {
    component.setFilter('active');
    expect(component.filteredManagers().length).toBe(1);
    expect(component.filteredManagers()[0].active).toBe(true);

    component.setFilter('inactive');
    expect(component.filteredManagers().length).toBe(1);
    expect(component.filteredManagers()[0].active).toBe(false);
  });
});
