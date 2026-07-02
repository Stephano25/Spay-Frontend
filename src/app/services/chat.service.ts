// frontend/src/app/services/chat.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { catchError, filter, distinctUntilChanged } from 'rxjs/operators';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'emoji' | 'money';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  emoji?: string;
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  moneyTransfer?: {
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    failReason?: string;
  };
  reactions?: { userId: string; emoji: string }[];
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage?: { content: string; type: string; createdAt: Date };
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private socket: Socket | null = null;
  private apiUrl = `${environment.apiUrl}/chat`;
  private socketUrl = environment.socketUrl || environment.apiUrl;

  private newMessageSubject = new BehaviorSubject<Message | null>(null);
  private typingSubject = new BehaviorSubject<{ userId: string; isTyping: boolean } | null>(null);
  private onlineStatusSubject = new BehaviorSubject<{ userId: string; isOnline: boolean } | null>(null);
  private messageEditedSubject = new BehaviorSubject<Message | null>(null);
  private messageDeletedSubject = new BehaviorSubject<{ messageId: string } | null>(null);
  private messageReactionSubject = new BehaviorSubject<Message | null>(null);
  private messageBlockedSubject = new BehaviorSubject<{ receiverId: string; reason: string } | null>(null);
  private incomingCallSubject = new BehaviorSubject<{ from: string; type: 'audio' | 'video' } | null>(null);
  private callAnsweredSubject = new BehaviorSubject<{ by: string; accepted: boolean } | null>(null);

  public newMessage$ = this.newMessageSubject.asObservable().pipe(
    filter((m): m is Message => m !== null),
    distinctUntilChanged((a, b) => a.id === b.id)
  );
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();
  public messageEdited$ = this.messageEditedSubject.asObservable().pipe(filter((m): m is Message => m !== null));
  public messageDeleted$ = this.messageDeletedSubject.asObservable().pipe(filter((m): m is { messageId: string } => m !== null));
  public messageReaction$ = this.messageReactionSubject.asObservable().pipe(filter((m): m is Message => m !== null));
  public messageBlocked$ = this.messageBlockedSubject.asObservable().pipe(filter((m): m is { receiverId: string; reason: string } => m !== null));
  public incomingCall$ = this.incomingCallSubject.asObservable();
  public callAnswered$ = this.callAnsweredSubject.asObservable();

  private processedMessageIds = new Set<string>();
  private authSubscription: Subscription;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      if (user && !this.isConnecting) {
        this.connectSocket();
        this.requestNotificationPermission();
      } else if (!user) {
        this.disconnect();
      }
    });
  }

  // ✅ CORRECTION : Connexion Socket avec le bon namespace
  private connectSocket(): void {
    const token = this.authService.getToken();
    if (!token || this.isConnecting) return;
    
    if (this.socket?.connected) {
      console.log('✅ Socket déjà connecté');
      return;
    }

    this.isConnecting = true;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // ✅ Utiliser l'URL de base sans /api
    const baseUrl = this.socketUrl.replace('/api', '');
    console.log(`🔌 Connexion au socket: ${baseUrl}`);

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      forceNew: false,
      withCredentials: false
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connecté:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.socket?.emit('getOnlineUsers');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket déconnecté:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Erreur socket:', err.message);
      this.isConnecting = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
        this.disconnect();
      }
    });

    this.socket.on('reconnect_attempt', () => {
      const t = this.authService.getToken();
      if (t && this.socket) this.socket.auth = { token: t };
    });

    this.socket.on('newMessage', (msg: Message) => {
      if (this.processedMessageIds.has(msg.id)) return;
      this.processedMessageIds.add(msg.id);
      setTimeout(() => this.processedMessageIds.delete(msg.id), 10000);
      this.notificationService.playNotificationSound?.();
      this.newMessageSubject.next(msg);
      this.showPushNotification(msg);
    });

    this.socket.on('userTyping', (data) => this.typingSubject.next(data));
    this.socket.on('userOnline', (data) => this.onlineStatusSubject.next(data));

    this.socket.on('onlineUsers', (users: string[]) => {
      const myId = this.authService.getCurrentUser()?.id;
      users.forEach(userId => {
        if (userId !== myId) {
          this.onlineStatusSubject.next({ userId, isOnline: true });
        }
      });
    });

    this.socket.on('messageEdited', (msg: Message) => this.messageEditedSubject.next(msg));
    this.socket.on('messageDeleted', (data: { messageId: string }) => this.messageDeletedSubject.next(data));
    this.socket.on('messageReaction', (msg: Message) => this.messageReactionSubject.next(msg));
    this.socket.on('messageBlocked', (data) => this.messageBlockedSubject.next(data));
    this.socket.on('incomingCall', (data) => this.incomingCallSubject.next(data));
    this.socket.on('callAnswered', (data) => this.callAnsweredSubject.next(data));
    this.socket.on('error', (err) => console.error('❌ Erreur socket:', err));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // ── REST API ──

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      catchError(() => of([]))
    );
  }

  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`).pipe(
      catchError(() => of([]))
    );
  }

  sendMessage(message: any): void {
    if (!this.socket?.connected) {
      this.connectSocket();
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit('sendMessage', message);
        } else {
          console.warn('⚠️ Socket non connecté, message non envoyé');
        }
      }, 1500);
      return;
    }
    this.socket.emit('sendMessage', message);
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { receiverId, isTyping });
  }

  markAsRead(senderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {}).pipe(
      catchError(() => of(void 0))
    );
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(`${this.apiUrl}/upload`, formData).pipe(
      catchError(() => of({ url: '', fileName: '', fileSize: 0 }))
    );
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/message/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<Message> {
    return this.http.delete<Message>(`${this.apiUrl}/message/${messageId}`);
  }

  reactToMessage(messageId: string, emoji: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/message/${messageId}/react`, { emoji });
  }

  removeReaction(messageId: string): Observable<Message> {
    return this.http.delete<Message>(`${this.apiUrl}/message/${messageId}/react`);
  }

  startCall(receiverId: string, type: 'audio' | 'video'): void {
    if (!this.socket?.connected) return;
    this.socket.emit('startCall', { receiverId, type });
  }

  answerCall(callerId: string, accepted: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('answerCall', { callerId, accepted });
  }

  requestOnlineUsers(): void {
    if (this.socket?.connected) this.socket.emit('getOnlineUsers');
  }

  isSocketConnected(): boolean { return this.socket?.connected || false; }

  private async requestNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
  }

  private showPushNotification(message: Message): void {
    if (!document.hidden) return;
    if (Notification.permission !== 'granted') return;
    const title = `📩 ${message.sender?.firstName || 'Nouveau message'}`;
    const body = message.content || (message.type === 'emoji' ? message.emoji : '') || message.type || 'Message';
    new Notification(title, { body, icon: '/assets/icons/icon-192x192.png' });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.disconnect();
  }
}