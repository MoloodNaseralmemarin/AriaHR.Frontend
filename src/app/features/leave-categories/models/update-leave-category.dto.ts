export interface UpdateLeaveCategoryDto {
  name: string;
  maxDaysPerYear: number;
  isPaid: boolean;
  requiresAttachment: boolean;
}
