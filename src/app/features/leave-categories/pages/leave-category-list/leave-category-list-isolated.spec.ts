import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';

import { LeaveCategoryListComponent } from './leave-category-list.component';
import { Router } from '@angular/router';

import { LeaveCategoryService } from '../../services/leave-category.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LeaveCategoryDto } from '../../models/leave-category.dto';

describe('LeaveCategoryListComponent (Isolated Unit Tests)', () => {
  const mockLeaveCategoryService = {
    getAll: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
  };

  const mockAuthService = {
    userDetails: vi.fn().mockReturnValue({ organizationId: 'org-1' }),
    getCurrentUser: vi.fn().mockReturnValue(of({ organizationId: 'org-1' })),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockCategories: LeaveCategoryDto[] = [
    {
      id: 'cat-1',
      organizationId: 'org-1',
      name: 'مرخصی سالانه',
      maxDaysPerYear: 30,
      isPaid: true,
      requiresAttachment: false,
      isActive: true,
    },
    {
      id: 'cat-2',
      organizationId: 'org-1',
      name: 'مرخصی بدون حقوق',
      maxDaysPerYear: 15,
      isPaid: false,
      requiresAttachment: true,
      isActive: false,
    },
  ];

  function createComponent(): LeaveCategoryListComponent {
    const injector = Injector.create({
      providers: [
        { provide: LeaveCategoryService, useValue: mockLeaveCategoryService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    return runInInjectionContext(injector, () => new LeaveCategoryListComponent());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadCategories() should fetch and populate categories signal', () => {
    mockLeaveCategoryService.getAll.mockReturnValue(of(mockCategories));
    const comp = createComponent();

    comp.loadCategories();

    expect(comp.categories()).toEqual(mockCategories);
    expect(comp.isLoading()).toBe(false);
  });

  it('filteredCategories should filter by status and search query', () => {
    mockLeaveCategoryService.getAll.mockReturnValue(of(mockCategories));
    const comp = createComponent();
    comp.loadCategories();

    // All
    expect(comp.filteredCategories().length).toBe(2);

    // Filter Active
    comp.setFilter('active');
    expect(comp.filteredCategories().length).toBe(1);
    expect(comp.filteredCategories()[0].id).toBe('cat-1');

    // Filter Inactive
    comp.setFilter('inactive');
    expect(comp.filteredCategories().length).toBe(1);
    expect(comp.filteredCategories()[0].id).toBe('cat-2');

    // Search query
    comp.setFilter('all');
    comp.onSearchInput('بدون حقوق');
    expect(comp.filteredCategories().length).toBe(1);
    expect(comp.filteredCategories()[0].id).toBe('cat-2');
  });

  it('confirmToggleActive() sets pendingToggleItem', () => {
    const comp = createComponent();
    comp.confirmToggleActive(mockCategories[0]);
    expect(comp.pendingToggleItem()).toEqual(mockCategories[0]);

    comp.cancelToggleActive();
    expect(comp.pendingToggleItem()).toBeNull();
  });

  it('executeToggleActive() calls deactivate when category is active', () => {
    mockLeaveCategoryService.getAll.mockReturnValue(of(mockCategories));
    mockLeaveCategoryService.deactivate.mockReturnValue(
      of({ ...mockCategories[0], isActive: false })
    );

    const comp = createComponent();
    comp.loadCategories();
    comp.confirmToggleActive(mockCategories[0]);

    comp.executeToggleActive();

    expect(mockLeaveCategoryService.deactivate).toHaveBeenCalledWith('cat-1');
    expect(comp.categories().find((c) => c.id === 'cat-1')?.isActive).toBe(false);
  });

  it('executeToggleActive() calls activate when category is inactive', () => {
    mockLeaveCategoryService.getAll.mockReturnValue(of(mockCategories));
    mockLeaveCategoryService.activate.mockReturnValue(
      of({ ...mockCategories[1], isActive: true })
    );

    const comp = createComponent();
    comp.loadCategories();
    comp.confirmToggleActive(mockCategories[1]);

    comp.executeToggleActive();

    expect(mockLeaveCategoryService.activate).toHaveBeenCalledWith('cat-2');
    expect(comp.categories().find((c) => c.id === 'cat-2')?.isActive).toBe(true);
  });
});
