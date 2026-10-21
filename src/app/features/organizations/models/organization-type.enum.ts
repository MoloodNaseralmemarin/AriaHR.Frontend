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
 * Maps string Enum names to numeric OrganizationType values.
 */
export const ORGANIZATION_TYPE_NAME_MAP: Record<string, OrganizationType> = {
  Clinic: OrganizationType.Clinic,
  ImagingCenter: OrganizationType.ImagingCenter,
  MedicalOffice: OrganizationType.MedicalOffice,
  Laboratory: OrganizationType.Laboratory,
  Pharmacy: OrganizationType.Pharmacy,
};

/**
 * Returns the Persian display label for a given organization type.
 * Handles string Enum names (e.g. 'Clinic'), numeric values, Enum instances, and missing/null values gracefully.
 */
export function getOrganizationTypeLabel(
  type: OrganizationType | number | string | null | undefined
): string {
  if (type === null || type === undefined || type === '') {
    return 'تعیین نشده';
  }

  // Handle string Enum name (e.g. "Clinic", "ImagingCenter")
  if (typeof type === 'string' && type in ORGANIZATION_TYPE_NAME_MAP) {
    const enumVal = ORGANIZATION_TYPE_NAME_MAP[type];
    return ORGANIZATION_TYPE_LABELS[enumVal];
  }

  // Handle numeric value or numeric string / Enum instance
  const numericType = Number(type);
  if (!isNaN(numericType) && numericType in ORGANIZATION_TYPE_LABELS) {
    return ORGANIZATION_TYPE_LABELS[numericType as OrganizationType];
  }

  return 'نامشخص';
}
