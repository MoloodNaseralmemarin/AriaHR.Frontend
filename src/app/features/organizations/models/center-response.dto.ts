export interface CenterResponseDto {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
}
