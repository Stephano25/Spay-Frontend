export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
  otherUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'money';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  isDelivered: boolean;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}