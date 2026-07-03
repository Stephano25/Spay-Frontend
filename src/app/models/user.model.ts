// frontend/src/app/models/user.model.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  balance: number;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  profilePicture?: string | null; // ✅ Accepter null
  qrCode?: string;
  bio?: string;
}

export interface LoginResponse {
  access_token: string;
  token: string;
  user: User;
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