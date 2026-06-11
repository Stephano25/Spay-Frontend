// src/app/models/user.model.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  profilePhoto?: string;
  balance: number;
  qrCode: string;
  friends: string[];
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  bio?: string;
  birthday?: Date;
  gender?: string;
}

export interface LoginResponse {
  user: User;
  access_token?: string;
  token?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UserSettings {
  general: {
    autoplayVideos: boolean;
    nsfwFilter: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    friendRequests: boolean;
    comments: boolean;
    likes: boolean;
    messages: boolean;
    mentions: boolean;
    groupActivities: boolean;
    dailyDigest: 'never' | 'daily' | 'weekly';
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    postVisibility: 'public' | 'friends' | 'only_me';
    showLastSeen: boolean;
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    allowMessagesFromNonFriends: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
    compactMode: boolean;
  };
}