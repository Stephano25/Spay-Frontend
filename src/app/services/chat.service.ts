import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { catchError, filter, distinctUntilChanged } from 'rxjs/operators';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'money';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  emoji?: string;
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  moneyTransfer?: { amount: number; status: string; transactionId?: string; failReason?: string };
  reactions?: { userId: string; emoji: string }[];
  sender?: { id: string; firstName: string; lastName: string; profilePicture?: string };
}

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage?: { content: string; type: string; createdAt: Date };
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: Date;
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

  public newMessage$ = this.newMessageSubject.asObservable().pipe(
    filter((m): m is Message => m !== null),
    distinctUntilChanged((a, b) => a.id === b.id)
  );
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();
  public messageEdited$ = this.messageEditedSubject.asObservable().pipe(
    filter((m): m is Message => m !== null)
  );
  public messageDeleted$ = this.messageDeletedSubject.asObservable().pipe(
    filter((m): m is { messageId: string } => m !== null)
  );
  public messageReaction$ = this.messageReactionSubject.asObservable().pipe(
    filter((m): m is Message => m !== null)
  );
  public messageBlocked$ = this.messageBlockedSubject.asObservable().pipe(
    filter((m): m is { receiverId: string; reason: string } => m !== null)
  );

  private processedMessageIds = new Set<string>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      this.connectSocket();
      this.requestNotificationPermission();
    }
  }

  private connectSocket(): void {
    const token = this.authService.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true
    });

    this.socket.on('connect', () => console.log('✅ Socket connecté'));
    this.socket.on('disconnect', () => console.log('❌ Socket déconnecté'));

    this.socket.on('newMessage', (msg: Message) => {
      if (this.processedMessageIds.has(msg.id)) return;
      this.processedMessageIds.add(msg.id);
      setTimeout(() => this.processedMessageIds.delete(msg.id), 10000);

      this.notificationService.playNotificationSound();
      this.newMessageSubject.next(msg);
      this.showPushNotification(msg);
    });

    this.socket.on('userTyping', (data) => this.typingSubject.next(data));
    this.socket.on('userOnline', (data) => this.onlineStatusSubject.next(data));
    this.socket.on('messageEdited', (msg: Message) => this.messageEditedSubject.next(msg));
    this.socket.on('messageDeleted', (data: { messageId: string }) => this.messageDeletedSubject.next(data));
    this.socket.on('messageReaction', (msg: Message) => this.messageReactionSubject.next(msg));
    this.socket.on('messageBlocked', (data) => this.messageBlockedSubject.next(data));
    this.socket.on('error', (err) => this.notificationService.showError(err.message));
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(catchError(() => of([])));
  }

  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`).pipe(catchError(() => of([])));
  }

  sendMessage(message: any): void {
    if (this.socket?.connected) this.socket.emit('sendMessage', message);
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket?.connected) this.socket.emit('typing', { receiverId, isTyping });
  }

  markAsRead(senderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {}).pipe(catchError(() => of(void 0)));
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(`${this.apiUrl}/upload`, formData)
      .pipe(catchError(() => of({ url: '', fileName: '', fileSize: 0 })));
  }

  /** Modifie un message texte (action "Modifier" de la barre d'actions). */
  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/message/${messageId}`, { content });
  }

  /** Suppression douce : le backend renvoie le message avec isDeleted=true. */
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
    if (this.socket?.connected) this.socket.emit('startCall', { receiverId, type });
  }

  private async requestNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  private showPushNotification(message: Message): void {
    if (!document.hidden) return;
    if (Notification.permission !== 'granted') return;

    const title = `📩 ${message.sender?.firstName || 'Nouveau message'}`;
    const body = message.content
      || (message.type === 'emoji' ? message.emoji : '')
      || (message.type === 'money' ? '💸 Transfert d\'argent' : '')
      || (message.type === 'image' ? '📷 Photo' : '')
      || 'Message';
    const iconUrl = '/assets/icons/image02.png';

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: iconUrl,
        url: `/user/chat?friendId=${message.senderId}`
      });
    } else {
      new Notification(title, { body, icon: iconUrl, badge: iconUrl });
    }
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }
}