export interface LeaveCategoryDto {
  id: string;
  organizationId: string;
  name: string;
  maxDaysPerYear: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
}
