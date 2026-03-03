import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../anvironments/environment';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'emoji' | 'money';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  emoji?: string;
  isRead: boolean;
  createdAt: Date;
  moneyTransfer?: {
    amount: number;
    status: string;
  };
}

export interface Conversation {
  userId: string;
  name: string;
  profilePicture?: string;
  lastMessage: Message;
  lastMessageTime: Date;
  unreadCount: number;
  online: boolean;
}

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: Socket | null = null; // Initialisé à null
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.connectSocket();
  }

  private connectSocket(): void {
    const token = this.authService.getToken();
    
    if (token) {
      this.socket = io(environment.socketUrl, {
        auth: { token },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
  }

  // Socket events
  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('newMessage', (message: Message) => {
          observer.next(message);
        });
      }
    });
  }

  onMessageSent(): Observable<Message> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('messageSent', (message: Message) => {
          observer.next(message);
        });
      }
    });
  }

  onUserTyping(): Observable<{ userId: string; isTyping: boolean }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('userTyping', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onUserOnline(): Observable<{ userId: string; online: boolean }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('userOnline', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onIncomingCall(): Observable<{ callerId: string; type: 'video' | 'audio'; signal: any }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('incomingCall', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onCallAccepted(): Observable<{ signal: any }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('callAccepted', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onIceCandidate(): Observable<{ candidate: any }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('iceCandidate', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onCallFailed(): Observable<{ message: string }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('callFailed', (data) => {
          observer.next(data);
        });
      }
    });
  }

  // Emit events
  sendMessage(message: { receiverId: string; type: string; content?: string; fileUrl?: string; fileName?: string; fileSize?: number; emoji?: string }): void {
    if (this.socket) {
      this.socket.emit('sendMessage', message);
    }
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  startCall(receiverId: string, type: 'video' | 'audio'): void {
    if (this.socket) {
      this.socket.emit('startCall', { receiverId, type });
    }
  }

  acceptCall(callerId: string, signal: any): void {
    if (this.socket) {
      this.socket.emit('acceptCall', { callerId, signal });
    }
  }

  sendIceCandidate(userId: string, candidate: any): void {
    if (this.socket) {
      this.socket.emit('iceCandidate', { userId, candidate });
    }
  }

  // HTTP requests
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/chat/conversations`);
  }

  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/messages/${userId}`);
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(
      `${this.apiUrl}/chat/upload`, 
      formData
    );
  }

  searchUsers(query: string): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.apiUrl}/users/search?q=${query}`);
  }

  markAsRead(senderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/chat/read/${senderId}`, {});
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}