export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
}

export interface AdminLoginResponse {
  admin: Admin;
  token: string;
}

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  activeUsers: number;
  pendingTransactions: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'user_registered' | 'transaction' | 'admin_action';
  description: string;
  userId?: string;
  adminId?: string;
  timestamp: Date;
  metadata?: any;
}