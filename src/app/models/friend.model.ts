export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked' | 'deleted';
  blockedBy?: string; // ID de l'utilisateur qui a bloqué
  deletedBy?: string; // ID de l'utilisateur qui a supprimé
  createdAt: Date;
  updatedAt: Date;
  friend?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
}

export interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  isBlocked: boolean;
  blockedBy?: string;
}

export interface FriendResponse {
  success: boolean;
  message?: string;
  data?: any;
  conversationId?: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}