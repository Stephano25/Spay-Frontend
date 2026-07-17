// frontend/src/app/services/chat.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  mimeType?: string;
  emoji?: string;
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  duration?: number; // Pour les vidéos et audios
  thumbnail?: string; // Miniature pour les vidéos
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
  lastMessage?: { content: string; type: string; createdAt: Date; fileUrl?: string; fileName?: string };
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private socket: Socket | null = null;
  private apiUrl = `${environment.apiUrl}/chat`;
  private socketUrl = environment.socketUrl || environment.apiUrl || 'http://localhost:3000';

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
    distinctUntilChanged((a, b) => a.id === b.id),
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
  private maxReconnectAttempts = 10;
  private connectionTimeout: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      if (user && !this.isConnecting) {
        console.log('👤 Utilisateur connecté, connexion socket...');
        setTimeout(() => this.connectSocket(), 500);
      } else if (!user) {
        this.disconnect();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    });
  }

  private connectSocket(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.log('⚠️ Pas de token, impossible de se connecter au socket');
      return;
    }

    if (this.isConnecting) {
      console.log('⚠️ Déjà en cours de connexion');
      return;
    }

    if (this.socket?.connected) {
      console.log('✅ Socket déjà connecté');
      return;
    }

    this.isConnecting = true;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    let baseUrl = this.socketUrl;
    if (baseUrl.startsWith('/')) {
      baseUrl = window.location.origin + baseUrl;
    }
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'http://' + baseUrl;
    }

    console.log(`🔌 Connexion au socket: ${baseUrl}`);

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      forceNew: true,
      withCredentials: false,
      path: '/socket.io/',
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connecté:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.socket?.emit('getOnlineUsers');
      this.notificationService?.showSuccess('Connecté au serveur de messagerie');
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
        this.notificationService?.showError('Impossible de se connecter au serveur de messagerie');
        this.disconnect();
      }
    });

    this.socket.on('reconnect_attempt', () => {
      const t = this.authService.getToken();
      if (t && this.socket) {
        this.socket.auth = { token: t };
      }
    });

    this.socket.on('newMessage', (msg: Message) => {
      console.log('📩 Nouveau message reçu:', msg);
      if (this.processedMessageIds.has(msg.id)) return;
      this.processedMessageIds.add(msg.id);
      setTimeout(() => this.processedMessageIds.delete(msg.id), 10000);
      
      this.notificationService?.playNotificationSound?.();
      this.newMessageSubject.next(msg);
      this.showPushNotification(msg);
    });

    this.socket.on('userTyping', (data) => {
      console.log('✍️ Typing:', data);
      this.typingSubject.next(data);
    });

    this.socket.on('userOnline', (data) => {
      console.log('🟢 Online:', data);
      this.onlineStatusSubject.next(data);
    });

    this.socket.on('onlineUsers', (users: string[]) => {
      console.log('👥 Utilisateurs en ligne:', users);
      const myId = this.authService.getCurrentUser()?.id;
      users.forEach(userId => {
        if (userId !== myId) {
          this.onlineStatusSubject.next({ userId, isOnline: true });
        }
      });
    });

    this.socket.on('messageEdited', (msg: Message) => {
      console.log('✏️ Message modifié:', msg);
      this.messageEditedSubject.next(msg);
    });

    this.socket.on('messageDeleted', (data: { messageId: string }) => {
      console.log('🗑️ Message supprimé:', data);
      this.messageDeletedSubject.next(data);
    });

    this.socket.on('messageReaction', (msg: Message) => {
      console.log('😊 Réaction:', msg);
      this.messageReactionSubject.next(msg);
    });

    this.socket.on('messageBlocked', (data) => {
      console.log('🚫 Message bloqué:', data);
      this.messageBlockedSubject.next(data);
    });

    this.socket.on('incomingCall', (data) => {
      console.log('📞 Appel entrant:', data);
      this.incomingCallSubject.next(data);
    });

    this.socket.on('callAnswered', (data) => {
      console.log('📞 Appel répondus:', data);
      this.callAnsweredSubject.next(data);
    });

    this.socket.on('error', (err) => {
      console.error('❌ Erreur socket:', err);
    });

    if (!this.connectionTimeout) {
      this.connectionTimeout = setInterval(() => {
        if (!this.socket?.connected && !this.isConnecting) {
          console.log('🔄 Tentative de reconnexion automatique...');
          this.connectSocket();
        }
      }, 30000);
    }
  }

  disconnect(): void {
    if (this.connectionTimeout) {
      clearInterval(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    console.log('🔌 Socket déconnecté');
  }

  // ── REST API ──

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`, { headers: this.getHeaders() }).pipe(
      catchError(() => of([])),
    );
  }

  /**
   * ✅ Récupère TOUS les messages entre deux utilisateurs
   */
  getMessages(userId: string, page: number = 1, limit: number = 100): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`, { 
      headers: this.getHeaders(),
      params: { page: page.toString(), limit: limit.toString() }
    }).pipe(
      catchError(() => of([])),
    );
  }

  sendMessage(message: any): void {
    if (!message.receiverId) {
      console.error('❌ Pas de receiverId');
      this.notificationService?.showError('Destinataire manquant');
      return;
    }

    // ✅ Ajouter le mimeType pour les fichiers
    if (message.fileUrl) {
      message.mimeType = message.mimeType || this.getMimeTypeFromUrl(message.fileUrl);
    }

    if (!this.socket?.connected) {
      console.log('🔄 Socket non connecté, tentative de reconnexion...');
      this.connectSocket();
      
      let attempts = 0;
      const maxAttempts = 10;
      const trySend = () => {
        attempts++;
        if (this.socket?.connected) {
          console.log('✅ Socket reconnecté, envoi du message...');
          this.socket.emit('sendMessage', message);
        } else if (attempts < maxAttempts) {
          setTimeout(trySend, 500);
        } else {
          console.warn('⚠️ Socket non connecté après ' + maxAttempts + ' tentatives');
          this.notificationService?.showError('Connexion au serveur impossible');
        }
      };
      setTimeout(trySend, 1000);
      return;
    }

    console.log('📤 Envoi du message:', message);
    this.socket.emit('sendMessage', message);
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { receiverId, isTyping });
  }

  markAsRead(senderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {}, { headers: this.getHeaders() }).pipe(
      catchError(() => of(void 0)),
    );
  }

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('✅ Socket déjà connecté');
      return;
    }
    this.connectSocket();
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number; mimeType: string }>(
      `${this.apiUrl}/upload`,
      formData,
      { headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` }) },
    ).pipe(
      catchError(() => of({ url: '', fileName: '', fileSize: 0, mimeType: '' })),
    );
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/message/${messageId}`, { content }, { headers: this.getHeaders() });
  }

  deleteMessage(messageId: string): Observable<Message> {
    return this.http.delete<Message>(`${this.apiUrl}/message/${messageId}`, { headers: this.getHeaders() });
  }

  reactToMessage(messageId: string, emoji: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/message/${messageId}/react`, { emoji }, { headers: this.getHeaders() });
  }

  removeReaction(messageId: string): Observable<Message> {
    return this.http.delete<Message>(`${this.apiUrl}/message/${messageId}/react`, { headers: this.getHeaders() });
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
    if (this.socket?.connected) {
      this.socket.emit('getOnlineUsers');
    }
  }

  isSocketConnected(): boolean {
    return this.socket?.connected || false;
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
    
    try {
      const title = `📩 ${message.sender?.firstName || 'Nouveau message'}`;
      const body = message.content || (message.type === 'emoji' ? message.emoji : '') || message.type || 'Message';
      new Notification(title, { 
        body, 
        icon: '/assets/icons/icon-192x192.png',
        silent: false,
      });
    } catch (error) {
      console.warn('Erreur notification:', error);
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    if (this.connectionTimeout) {
      clearInterval(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.disconnect();
  }
}