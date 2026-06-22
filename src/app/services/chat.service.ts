// src/app/services/chat.service.ts
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
  type: 'text' | 'image' | 'file' | 'emoji' | 'money';
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
  lastMessage?: {
    content: string;
    type: string;
    createdAt: Date;
  };
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
  private authSubscription: Subscription;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        console.log('👤 Utilisateur connecté, tentative de connexion socket...');
        this.connectSocket();
        this.requestNotificationPermission();
      } else {
        console.log('👤 Utilisateur déconnecté, fermeture socket');
        this.disconnect();
      }
    });
  }

  // ============================================================
  // 🔥 CONNEXION SOCKET – Version robuste pour tous les navigateurs
  // ============================================================

  private connectSocket(): void {
    const token = this.authService.getToken();
    console.log('🔑 Token présent:', !!token);
    
    if (!token) {
      console.warn('⚠️ Token manquant, impossible de se connecter au socket');
      return;
    }

    if (this.socket?.connected) {
      console.log('🔌 Socket déjà connecté');
      return;
    }

    // Fermer l'ancienne connexion si elle existe
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('🔌 Tentative de connexion socket...', this.socketUrl);
    
    // 🔥 Options robustes pour tous les navigateurs
    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      withCredentials: false,
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // 🔥 Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ Socket connecté avec succès, ID:', this.socket?.id);
      // Demander la liste des utilisateurs connectés
      this.socket?.emit('getOnlineUsers');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket déconnecté, raison:', reason);
      if (reason === 'io server disconnect') {
        // Le serveur a déconnecté, tenter de se reconnecter
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion socket:', err.message);
      // 🔥 En cas d'erreur, essayer de se reconnecter avec polling uniquement
      if (err.message.includes('websocket') && this.socket) {
        console.log('🔄 Tentative de reconnexion avec polling uniquement...');
        if (this.socket.io?.opts) {
          this.socket.io.opts.transports = ['polling'];
        }
      }
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`🔄 Socket reconnecté après ${attempt} tentative(s)`);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Tentative de reconnexion ${attempt}...`);
      const token = this.authService.getToken();
      if (token && this.socket) {
        this.socket.auth = { token };
      }
    });

    // 🔥 Événements d'application
    this.socket.on('newMessage', (msg: Message) => {
      console.log('📩 Nouveau message reçu:', msg);
      if (this.processedMessageIds.has(msg.id)) return;
      this.processedMessageIds.add(msg.id);
      setTimeout(() => this.processedMessageIds.delete(msg.id), 10000);

      this.notificationService.playNotificationSound();
      this.newMessageSubject.next(msg);
      this.showPushNotification(msg);
    });

    this.socket.on('userTyping', (data) => {
      console.log('📝 userTyping reçu:', data);
      this.typingSubject.next(data);
    });

    this.socket.on('userOnline', (data) => {
      console.log('📡 userOnline reçu dans le service:', data);
      this.onlineStatusSubject.next(data);
    });

    this.socket.on('onlineUsers', (users: string[]) => {
      console.log('📊 Liste des utilisateurs connectés:', users);
      // Notifier pour chaque utilisateur connecté
      users.forEach(userId => {
        if (userId !== this.authService.getCurrentUser()?.id) {
          this.onlineStatusSubject.next({
            userId: userId,
            isOnline: true
          });
        }
      });
    });

    this.socket.on('messageEdited', (msg: Message) => {
      console.log('✏️ messageEdited reçu:', msg);
      this.messageEditedSubject.next(msg);
    });

    this.socket.on('messageDeleted', (data: { messageId: string }) => {
      console.log('🗑️ messageDeleted reçu:', data);
      this.messageDeletedSubject.next(data);
    });

    this.socket.on('messageReaction', (msg: Message) => {
      console.log('😊 messageReaction reçu:', msg);
      this.messageReactionSubject.next(msg);
    });

    this.socket.on('messageBlocked', (data) => {
      console.log('🚫 messageBlocked reçu:', data);
      this.messageBlockedSubject.next(data);
    });

    this.socket.on('error', (err) => {
      console.error('❌ Erreur socket:', err);
      this.notificationService.showError(err.message || 'Erreur de connexion');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ============================================================
  // 🔥 API REST
  // ============================================================

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      catchError((err) => {
        console.error('❌ Erreur getConversations:', err);
        return of([]);
      })
    );
  }

  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`).pipe(
      catchError((err) => {
        console.error('❌ Erreur getMessages:', err);
        return of([]);
      })
    );
  }

  sendMessage(message: any): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket non connecté, tentative de reconnexion...');
      this.connectSocket();
      setTimeout(() => {
        if (this.socket?.connected) {
          console.log('📤 Envoi message (après reconnexion):', message);
          this.socket.emit('sendMessage', message);
        } else {
          console.error('❌ Impossible d\'envoyer le message, socket non connecté');
          this.notificationService.showError('Impossible d\'envoyer le message');
        }
      }, 1000);
      return;
    }
    console.log('📤 Envoi message:', message);
    this.socket.emit('sendMessage', message);
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { receiverId, isTyping });
  }

  markAsRead(senderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {}).pipe(
      catchError((err) => {
        console.error('❌ Erreur markAsRead:', err);
        return of(void 0);
      })
    );
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(`${this.apiUrl}/upload`, formData)
      .pipe(
        catchError((err) => {
          console.error('❌ Erreur uploadFile:', err);
          return of({ url: '', fileName: '', fileSize: 0 });
        })
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

  /**
   * 🔥 Demande la liste des utilisateurs connectés
   */
  requestOnlineUsers(): void {
    if (this.socket?.connected) {
      this.socket.emit('getOnlineUsers');
    }
  }

  // ============================================================
  // 🔥 NOTIFICATIONS PUSH
  // ============================================================

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

  // ============================================================
  // 🔥 MÉTHODES UTILITAIRES
  // ============================================================

  isSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.disconnect();
  }
}