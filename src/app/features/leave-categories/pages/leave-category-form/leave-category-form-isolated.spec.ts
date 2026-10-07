import '@angular/compiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => paramId,
        },
      },
      paramMap: of({
        get: (key: string) => paramId,
      }),
    };

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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize form in create mode by default', () => {
    const comp = createComponent(null);
    comp.ngOnInit();

    expect(comp.isEditMode()).toBe(false);
    expect(comp.categoryId()).toBeNull();
    expect(comp.form.get('name')?.value).toBe('');
    expect(comp.form.get('maxDaysPerYear')?.value).toBe(0);
    expect(comp.form.get('isPaid')?.value).toBe(true);
    expect(comp.form.get('requiresAttachment')?.value).toBe(false);
  });

  it('should correctly populate form when API returns PascalCase properties', () => {
    const pascalCaseCategory = {
      Id: 'cat-200',
      Name: 'مرخصی استعلاجی',
      MaxDaysPerYear: 15,
      IsPaid: false,
      RequiresAttachment: true,
      IsActive: true,
    };
    mockLeaveCategoryService.getById.mockReturnValue(of(pascalCaseCategory));
    const comp = createComponent('cat-200');
    comp.ngOnInit();

    expect(comp.isEditMode()).toBe(true);
    expect(comp.form.get('name')?.value).toBe('مرخصی استعلاجی');
    expect(comp.form.get('maxDaysPerYear')?.value).toBe(15);
    expect(comp.form.get('isPaid')?.value).toBe(false);
    expect(comp.form.get('requiresAttachment')?.value).toBe(true);
  });

  it('should initialize form in edit mode and populate values when ID is present in route', () => {
    mockLeaveCategoryService.getById.mockReturnValue(of(mockCategory));
    const comp = createComponent('cat-100');
    comp.ngOnInit();

    expect(comp.isEditMode()).toBe(true);
    expect(comp.categoryId()).toBe('cat-100');
    expect(comp.isLoading()).toBe(false);
    expect(mockLeaveCategoryService.getById).toHaveBeenCalledWith('cat-100');
    expect(comp.form.get('name')?.value).toBe('مرخصی سالانه');
    expect(comp.form.get('maxDaysPerYear')?.value).toBe(30);
    expect(comp.form.get('isPaid')?.value).toBe(true);
    expect(comp.form.get('requiresAttachment')?.value).toBe(false);
  });

  it('should handle error when loading category details fails', () => {
    mockLeaveCategoryService.getById.mockReturnValue(throwError(() => ({ error: { message: 'یافت نشد' } })));
    const comp = createComponent('cat-100');
    comp.ngOnInit();

    expect(comp.isLoading()).toBe(false);
    expect(comp.toastMessage()).toBe('یافت نشد');
    expect(comp.toastTone()).toBe('error');
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

  it('onSubmit() should mark all as touched and return early if form is invalid', () => {
    const comp = createComponent(null);
    comp.ngOnInit();
    comp.form.get('name')?.setValue('');

    comp.onSubmit();

    expect(comp.form.touched).toBe(true);
    expect(mockLeaveCategoryService.create).not.toHaveBeenCalled();
    expect(mockLeaveCategoryService.update).not.toHaveBeenCalled();
  });

  it('onSubmit() in create mode should call service.create with exact required 4 fields and navigate on success', () => {
    mockLeaveCategoryService.create.mockReturnValue(of(mockCategory));
    const comp = createComponent(null);
    comp.ngOnInit();

    comp.form.patchValue({
      name: ' مرخصی جدید ',
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
    expect(comp.isSubmitting()).toBe(false);
    expect(comp.toastMessage()).toBe('دسته‌بندی مرخصی جدید با موفقیت ثبت شد.');

    vi.advanceTimersByTime(1200);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/center-manager/leave-categories']);
  });

  it('onSubmit() in edit mode should call service.update with exact required 4 fields without id in payload and navigate on success', () => {
    mockLeaveCategoryService.getById.mockReturnValue(of(mockCategory));
    mockLeaveCategoryService.update.mockReturnValue(of(mockCategory));
    const comp = createComponent('cat-100');
    comp.ngOnInit();

    comp.form.patchValue({
      name: ' مرخصی ویرایش شده ',
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
    expect(comp.isSubmitting()).toBe(false);
    expect(comp.toastMessage()).toBe('دسته‌بندی مرخصی با موفقیت بروزرسانی شد.');

    vi.advanceTimersByTime(1200);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/center-manager/leave-categories']);
  });

  it('onSubmit() in edit mode should handle update API error', () => {
    mockLeaveCategoryService.getById.mockReturnValue(of(mockCategory));
    mockLeaveCategoryService.update.mockReturnValue(throwError(() => ({ error: { message: 'خطای سرور' } })));
    const comp = createComponent('cat-100');
    comp.ngOnInit();

    comp.onSubmit();

    expect(comp.isSubmitting()).toBe(false);
    expect(comp.toastMessage()).toBe('خطای سرور');
    expect(comp.toastTone()).toBe('error');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
