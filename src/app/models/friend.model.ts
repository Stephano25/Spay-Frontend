export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  friend?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
  blockedBy?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
  sender: {
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
  profilePicture?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  isBlocked: boolean;
  blockedBy?: string;
}

export interface FriendResponse {
  message: string;
  success: boolean;
  requestId?: string;
  conversationId?: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}