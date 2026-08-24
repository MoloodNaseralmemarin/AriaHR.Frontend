export type CenterStatus = 'active' | 'pending' | 'inactive';

export interface Center {
  id: string;
  name: string;
  managerName: string;
  employeeCount: number;
  status: CenterStatus;
  createdAt: string; // ISO date
  attendanceToday: number; // percentage 0-100
  shiftCount: number;
  pendingRequests: number;
}

export interface CenterManager {
  id: string;
  name: string;
  centerName: string;
  mobileNumber: string;
  createdAt: string;
  active: boolean;
}

export interface SystemActivity {
  id: string;
  type: 'center_created' | 'manager_created' | 'center_deactivated' | 'center_activated';
  label: string;
  detail: string;
  timestamp: string; // ISO date
}

export interface SystemAdminStats {
  totalCenters: number;
  activeCenters: number;
  pendingCenters: number;
  totalManagers: number;
  totalEmployees: number;
  newCentersThisMonth: number;
}

export interface CreateCenterPayload {
  // Center info
  centerName: string;
  centerType: string;
  address: string;
  phone: string;
  // Manager info
  managerName: string;
  managerMobile: string;
  managerEmail: string;
}
