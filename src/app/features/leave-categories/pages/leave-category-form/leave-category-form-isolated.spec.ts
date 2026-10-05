import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LeaveCategoryFormComponent } from './leave-category-form.component';
import { LeaveCategoryService } from '../../services/leave-category.service';
import { LeaveCategoryDto } from '../../models/leave-category.dto';

describe('LeaveCategoryFormComponent (Isolated Unit Tests)', () => {
  const mockLeaveCategoryService = {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: vi.fn(),
      },
    },
  };

  const mockCategory: LeaveCategoryDto = {
    id: 'cat-100',
    organizationId: 'org-1',
    name: 'مرخصی سالانه',
    maxDaysPerYear: 30,
    isPaid: true,
    requiresAttachment: false,
    isActive: true,
  };

  function createComponent(paramId: string | null = null): LeaveCategoryFormComponent {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(paramId);

    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: LeaveCategoryService, useValue: mockLeaveCategoryService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    return runInInjectionContext(injector, () => new LeaveCategoryFormComponent());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize form in create mode by default', () => {
    const comp = createComponent(null);
    comp.ngOnInit();

    expect(comp.isEditMode()).toBe(false);
    expect(comp.form.get('name')?.value).toBe('');
    expect(comp.form.get('maxDaysPerYear')?.value).toBe(0);
    expect(comp.form.get('isPaid')?.value).toBe(true);
    expect(comp.form.get('requiresAttachment')?.value).toBe(false);
  });

  it('should initialize form in edit mode when ID is present in route', () => {
    mockLeaveCategoryService.getById.mockReturnValue(of(mockCategory));
    const comp = createComponent('cat-100');
    comp.ngOnInit();

    expect(comp.isEditMode()).toBe(true);
    expect(mockLeaveCategoryService.getById).toHaveBeenCalledWith('cat-100');
    expect(comp.form.get('name')?.value).toBe('مرخصی سالانه');
    expect(comp.form.get('maxDaysPerYear')?.value).toBe(30);
  });

  it('should validate required name and whitespace', () => {
    const comp = createComponent(null);
    comp.ngOnInit();

    const nameControl = comp.form.get('name');
    nameControl?.setValue('   ');
    expect(nameControl?.valid).toBe(false);

    nameControl?.setValue('مرخصی استعلاجی');
    expect(nameControl?.valid).toBe(true);
  });

  it('should validate non-negative maxDaysPerYear', () => {
    const comp = createComponent(null);
    comp.ngOnInit();

    const maxDaysControl = comp.form.get('maxDaysPerYear');
    maxDaysControl?.setValue(-5);
    expect(maxDaysControl?.valid).toBe(false);

    maxDaysControl?.setValue(10);
    expect(maxDaysControl?.valid).toBe(true);
  });

  it('onSubmit() in create mode should call service.create without organizationId', () => {
    mockLeaveCategoryService.create.mockReturnValue(of(mockCategory));
    const comp = createComponent(null);
    comp.ngOnInit();

    comp.form.patchValue({
      name: 'مرخصی جدید',
      maxDaysPerYear: 12,
      isPaid: false,
      requiresAttachment: true,
    });

    comp.onSubmit();

    expect(mockLeaveCategoryService.create).toHaveBeenCalledWith({
      name: 'مرخصی جدید',
      maxDaysPerYear: 12,
      isPaid: false,
      requiresAttachment: true,
    });
  });

  it('onSubmit() in edit mode should call service.update without organizationId', () => {
    mockLeaveCategoryService.getById.mockReturnValue(of(mockCategory));
    mockLeaveCategoryService.update.mockReturnValue(of(mockCategory));
    const comp = createComponent('cat-100');
    comp.ngOnInit();

    comp.form.patchValue({
      name: 'مرخصی ویرایش شده',
      maxDaysPerYear: 15,
      isPaid: true,
      requiresAttachment: false,
    });

    comp.onSubmit();

    expect(mockLeaveCategoryService.update).toHaveBeenCalledWith('cat-100', {
      name: 'مرخصی ویرایش شده',
      maxDaysPerYear: 15,
      isPaid: true,
      requiresAttachment: false,
    });
  });
});
