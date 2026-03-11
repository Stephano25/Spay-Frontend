export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture?: string;
  balance: number; // Gardé pour compatibilité
  qrCode: string;
  friends: string[];
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  bio?: string;
  wallet?: { // Ajout de l'interface wallet
    id: string;
    balance: number;
    currency: string;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export interface LoginResponse {
  user: User;
  access_token?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}