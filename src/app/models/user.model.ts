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
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  permissions?: string[]; // Pour les admins
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}