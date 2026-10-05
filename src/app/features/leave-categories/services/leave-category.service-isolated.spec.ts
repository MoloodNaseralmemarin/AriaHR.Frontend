import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { LeaveCategoryService } from './leave-category.service';
import { LeaveCategoryDto } from '../models/leave-category.dto';
import { CreateLeaveCategoryDto } from '../models/create-leave-category.dto';
import { UpdateLeaveCategoryDto } from '../models/update-leave-category.dto';
import { environment } from '../../../../environments/environment';

describe('LeaveCategoryService (Isolated Unit Tests)', () => {
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  };

  const baseUrl = `${environment.apiUrl}/api/requests/leave-categories`;

  const mockCategory: LeaveCategoryDto = {
    id: 'cat-1',
    organizationId: 'org-123',
    name: 'مرخصی استحقاقی',
    maxDaysPerYear: 30,
    isPaid: true,
    requiresAttachment: false,
    isActive: true,
  };

  function createService(): LeaveCategoryService {
    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });

    return runInInjectionContext(injector, () => new LeaveCategoryService());
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll() should GET all leave categories', () => {
    mockHttpClient.get.mockReturnValue(of([mockCategory]));
    const service = createService();

    service.getAll().subscribe((result) => {
      expect(result).toEqual([mockCategory]);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(baseUrl);
  });

  it('getById() should GET category by ID', () => {
    mockHttpClient.get.mockReturnValue(of(mockCategory));
    const service = createService();

    service.getById('cat-1').subscribe((result) => {
      expect(result).toEqual(mockCategory);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith(`${baseUrl}/cat-1`);
  });

  it('create() should POST create DTO', () => {
    const createDto: CreateLeaveCategoryDto = {
      name: 'مرخصی استعلاجی',
      maxDaysPerYear: 15,
      isPaid: true,
      requiresAttachment: true,
    };

    mockHttpClient.post.mockReturnValue(of(mockCategory));
    const service = createService();

    service.create(createDto).subscribe((result) => {
      expect(result).toEqual(mockCategory);
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith(baseUrl, createDto);
  });

  it('update() should PUT update DTO', () => {
    const updateDto: UpdateLeaveCategoryDto = {
      name: 'مرخصی ویرایش شده',
      maxDaysPerYear: 20,
      isPaid: false,
      requiresAttachment: false,
    };

    mockHttpClient.put.mockReturnValue(of(mockCategory));
    const service = createService();

    service.update('cat-1', updateDto).subscribe((result) => {
      expect(result).toEqual(mockCategory);
    });

    expect(mockHttpClient.put).toHaveBeenCalledWith(`${baseUrl}/cat-1`, updateDto);
  });

  it('activate() should PUT to activate endpoint', () => {
    mockHttpClient.put.mockReturnValue(of({ ...mockCategory, isActive: true }));
    const service = createService();

    service.activate('cat-1').subscribe((result) => {
      expect(result.isActive).toBe(true);
    });

    expect(mockHttpClient.put).toHaveBeenCalledWith(`${baseUrl}/cat-1/activate`, {});
  });

  it('deactivate() should PUT to deactivate endpoint', () => {
    mockHttpClient.put.mockReturnValue(of({ ...mockCategory, isActive: false }));
    const service = createService();

    service.deactivate('cat-1').subscribe((result) => {
      expect(result.isActive).toBe(false);
    });

    expect(mockHttpClient.put).toHaveBeenCalledWith(`${baseUrl}/cat-1/deactivate`, {});
  });
});
