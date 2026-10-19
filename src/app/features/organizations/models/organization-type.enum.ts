export enum OrganizationType {
  Clinic = 1,
  ImagingCenter = 2,
  MedicalOffice = 3,
  Laboratory = 4,
  Pharmacy = 5,
}

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  [OrganizationType.Clinic]: 'کلینیک',
  [OrganizationType.ImagingCenter]: 'مرکز تصویربرداری',
  [OrganizationType.MedicalOffice]: 'مطب',
  [OrganizationType.Laboratory]: 'آزمایشگاه',
  [OrganizationType.Pharmacy]: 'داروخانه',
};

export interface OrganizationTypeOption {
  value: OrganizationType;
  label: string;
}

export const ORGANIZATION_TYPE_OPTIONS: OrganizationTypeOption[] = [
  { value: OrganizationType.Clinic, label: ORGANIZATION_TYPE_LABELS[OrganizationType.Clinic] },
  { value: OrganizationType.ImagingCenter, label: ORGANIZATION_TYPE_LABELS[OrganizationType.ImagingCenter] },
  { value: OrganizationType.MedicalOffice, label: ORGANIZATION_TYPE_LABELS[OrganizationType.MedicalOffice] },
  { value: OrganizationType.Laboratory, label: ORGANIZATION_TYPE_LABELS[OrganizationType.Laboratory] },
  { value: OrganizationType.Pharmacy, label: ORGANIZATION_TYPE_LABELS[OrganizationType.Pharmacy] },
];

/**
 * Returns the Persian display label for a given organization type.
 * Handles missing, null, or unsupported numeric values gracefully.
 */
export function getOrganizationTypeLabel(type: OrganizationType | number | null | undefined): string {
  if (type === null || type === undefined) {
    return 'تعیین نشده';
  }
  const numericType = Number(type);
  if (numericType in ORGANIZATION_TYPE_LABELS) {
    return ORGANIZATION_TYPE_LABELS[numericType as OrganizationType];
  }
  return 'نامشخص';
}
