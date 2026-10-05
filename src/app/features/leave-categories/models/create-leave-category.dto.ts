export interface CreateLeaveCategoryDto {
  name: string;
  maxDaysPerYear: number;
  isPaid: boolean;
  requiresAttachment: boolean;
}
