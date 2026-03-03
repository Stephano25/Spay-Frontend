export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture?: string;
  balance: number;
  qrCode: string;
  friends: string[];
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  usersByRole: {
    admin: number;
    user: number;
  };
}