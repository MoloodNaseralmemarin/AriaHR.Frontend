import { describe, it, expect } from 'vitest';
import {
  OrganizationType,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_OPTIONS,
  getOrganizationTypeLabel,
} from './organization-type.enum';

describe('OrganizationType Enum and Helpers', () => {
  it('should have correct numeric values matching the backend enum contract', () => {
    expect(OrganizationType.Clinic).toBe(1);
    expect(OrganizationType.ImagingCenter).toBe(2);
    expect(OrganizationType.MedicalOffice).toBe(3);
    expect(OrganizationType.Laboratory).toBe(4);
    expect(OrganizationType.Pharmacy).toBe(5);
  });

  it('should map numeric enum values to correct Persian labels', () => {
    expect(ORGANIZATION_TYPE_LABELS[OrganizationType.Clinic]).toBe('کلینیک');
    expect(ORGANIZATION_TYPE_LABELS[OrganizationType.ImagingCenter]).toBe('مرکز تصویربرداری');
    expect(ORGANIZATION_TYPE_LABELS[OrganizationType.MedicalOffice]).toBe('مطب');
    expect(ORGANIZATION_TYPE_LABELS[OrganizationType.Laboratory]).toBe('آزمایشگاه');
    expect(ORGANIZATION_TYPE_LABELS[OrganizationType.Pharmacy]).toBe('داروخانه');
  });

  it('should provide options array with all 5 organization types', () => {
    expect(ORGANIZATION_TYPE_OPTIONS).toHaveLength(5);
    expect(ORGANIZATION_TYPE_OPTIONS).toEqual([
      { value: 1, label: 'کلینیک' },
      { value: 2, label: 'مرکز تصویربرداری' },
      { value: 3, label: 'مطب' },
      { value: 4, label: 'آزمایشگاه' },
      { value: 5, label: 'داروخانه' },
    ]);
  });

  describe('getOrganizationTypeLabel', () => {
    it('should return correct Persian labels for valid numeric values', () => {
      expect(getOrganizationTypeLabel(1)).toBe('کلینیک');
      expect(getOrganizationTypeLabel(2)).toBe('مرکز تصویربرداری');
      expect(getOrganizationTypeLabel(3)).toBe('مطب');
      expect(getOrganizationTypeLabel(4)).toBe('آزمایشگاه');
      expect(getOrganizationTypeLabel(5)).toBe('داروخانه');
    });

    it('should return correct Persian labels for enum member inputs', () => {
      expect(getOrganizationTypeLabel(OrganizationType.Clinic)).toBe('کلینیک');
      expect(getOrganizationTypeLabel(OrganizationType.Laboratory)).toBe('آزمایشگاه');
    });

    it('should handle null or undefined gracefully', () => {
      expect(getOrganizationTypeLabel(null)).toBe('تعیین نشده');
      expect(getOrganizationTypeLabel(undefined)).toBe('تعیین نشده');
    });

    it('should return fallback label for unknown or unsupported numeric values', () => {
      expect(getOrganizationTypeLabel(99)).toBe('نامشخص');
      expect(getOrganizationTypeLabel(-1)).toBe('نامشخص');
    });
  });
});
