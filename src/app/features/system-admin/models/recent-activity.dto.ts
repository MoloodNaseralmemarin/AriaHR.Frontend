export interface RecentActivityDto {
  id: string | number;
  type?: string;
  label?: string;
  detail?: string;
  timestamp?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  createdAtUtc?: string;

  // Casing variations from backend JSON deserialization
  Id?: string | number;
  Type?: string;
  Label?: string;
  Detail?: string;
  Timestamp?: string;
  Title?: string;
  Description?: string;
  CreatedAt?: string;
  CreatedAtUtc?: string;
}
