import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { FriendService } from './friend.service';
import { environment } from '../../environments/environment';
import { catchError, tap, filter, distinctUntilChanged } from 'rxjs/operators';

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
  createdAt: Date;
  moneyTransfer?: {
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
  };
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  isBlocked?: boolean;
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
  isOnline: boolean;
  lastSeen?: Date;
  isBlocked?: boolean;
  blockedBy?: string;
  canMessage?: boolean;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private socket: Socket | null = null;
  private apiUrl = `${environment.apiUrl}/chat`;
  private socketUrl = environment.socketUrl || environment.apiUrl;
  
  private newMessageSubject = new BehaviorSubject<Message | null>(null);
  private typingSubject = new BehaviorSubject<TypingIndicator | null>(null);
  private onlineStatusSubject = new BehaviorSubject<{ userId: string; isOnline: boolean; lastSeen?: Date } | null>(null);
  private blockStatusSubject = new BehaviorSubject<{ userId: string; isBlocked: boolean; blockedBy?: string } | null>(null);
  
  // Set pour éviter les doublons de messages
  private processedMessageIds: Set<string> = new Set();
  
  public newMessage$ = this.newMessageSubject.asObservable().pipe(
    filter(msg => msg !== null),
    distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
  );
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();
  public blockStatus$ = this.blockStatusSubject.asObservable();

  private currentUserId: string = '';
  private isConnectedFlag: boolean = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private friendService: FriendService
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    this.connectSocket();
  }

  ngOnDestroy() {
    this.disconnect();
    this.processedMessageIds.clear();
  }

  private connectSocket(): void {
    const token = this.authService.getToken();
    if (!token || this.isConnectedFlag) return;

    try {
      this.socket = io(this.socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connecté');
        this.isConnectedFlag = true;
      });
      
      this.socket.on('disconnect', () => {
        console.log('❌ Socket déconnecté');
        this.isConnectedFlag = false;
      });

      this.socket.on('newMessage', (message: Message) => {
        // Vérifier si le message a déjà été traité
        if (this.processedMessageIds.has(message.id)) {
          console.log('Message déjà traité, ignoré:', message.id);
          return;
        }
        
        // Ajouter l'ID du message aux messages traités
        this.processedMessageIds.add(message.id);
        
        // Nettoyer le Set périodiquement pour éviter une accumulation excessive
        setTimeout(() => {
          this.processedMessageIds.delete(message.id);
        }, 10000); // Supprimer après 10 secondes
        
        this.newMessageSubject.next(message);
        this.playNotificationSound();
        if (document.hidden) this.showBrowserNotification(message);
      });

      this.socket.on('messageSent', (message: Message) => {
        console.log('✅ Message envoyé:', message);
        // Éviter de traiter le message envoyé comme un nouveau message
        if (!this.processedMessageIds.has(message.id)) {
          this.processedMessageIds.add(message.id);
          this.newMessageSubject.next(message);
        }
      });
      
      this.socket.on('userTyping', (data: TypingIndicator) => this.typingSubject.next(data));
      this.socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
        this.onlineStatusSubject.next(data);
      });
      this.socket.on('onlineUsers', (users: string[]) => console.log('👥 Utilisateurs en ligne:', users));
      this.socket.on('messageBlocked', (data: { receiverId: string; reason: string }) => {
        this.notificationService.showWarning('Message non envoyé : ' + data.reason);
      });
      this.socket.on('error', (data: { message: string }) => {
        console.error('❌ Erreur socket:', data);
        this.notificationService.showError(data.message);
      });
    } catch (error) {
      console.error('❌ Erreur de connexion socket:', error);
    }
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      tap(convs => console.log('📋 Conversations chargées:', convs)),
      catchError(error => {
        console.error('❌ Erreur chargement conversations:', error);
        return of([]);
      })
    );
  }

  getMessages(userId: string): Observable<Message[]> {
    if (!userId) return of([]);
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`).pipe(
      tap(msgs => console.log(`📋 Messages avec ${userId}:`, msgs)),
      catchError(error => {
        console.error('❌ Erreur chargement messages:', error);
        return of([]);
      })
    );
  }

  getMessagesPage(userId: string, page: number, limit: number): Observable<Message[]> {
    if (!userId) return of([]);
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`, {
      params: { page: page.toString(), limit: limit.toString() }
    }).pipe(
      catchError(error => {
        console.error('❌ Erreur chargement messages paginés:', error);
        return of([]);
      })
    );
  }

  sendMessage(message: {
    receiverId: string;
    type: 'text' | 'image' | 'file' | 'emoji' | 'money';
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    emoji?: string;
    moneyTransfer?: { amount: number; };
  }): void {
    if (!this.socket || !this.socket.connected) {
      this.notificationService.showError('Connexion perdue, reconnexion...');
      this.connectSocket();
      setTimeout(() => this.sendMessage(message), 1000);
      return;
    }
    this.socket.emit('sendMessage', message);
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  markAsRead(senderId: string): Observable<void> {
    if (!senderId) return of(void 0);
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {}).pipe(
      tap(() => {
        if (this.socket?.connected) this.socket.emit('markAsRead', { senderId });
      }),
      catchError(error => {
        console.error('❌ Erreur markAsRead:', error);
        return of(void 0);
      })
    );
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(`${this.apiUrl}/upload`, formData).pipe(
      tap(result => console.log('✅ Fichier uploadé:', result)),
      catchError(error => {
        console.error('❌ Erreur upload:', error);
        this.notificationService.showError('Erreur lors de l\'upload');
        return of({ url: '', fileName: '', fileSize: 0 });
      })
    );
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/search`, { params: { q: query } }).pipe(
      catchError(error => {
        console.error('❌ Erreur recherche:', error);
        return of([]);
      })
    );
  }

  updateMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/message/${messageId}`, { content }).pipe(
      tap(message => console.log('✅ Message mis à jour:', message)),
      catchError(error => {
        console.error('❌ Erreur mise à jour message:', error);
        this.notificationService.showError('Erreur lors de la mise à jour du message');
        return throwError(() => error);
      })
    );
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/message/${messageId}`).pipe(
      tap(() => console.log('✅ Message supprimé')),
      catchError(error => {
        console.error('❌ Erreur suppression message:', error);
        this.notificationService.showError('Erreur lors de la suppression du message');
        return throwError(() => error);
      })
    );
  }

  startCall(receiverId: string, type: 'audio' | 'video'): void {
    if (this.socket?.connected) {
      this.socket.emit('startCall', { receiverId, type });
    }
  }

  private playNotificationSound(): void {
    try {
      // Utiliser un son par défaut du navigateur plutôt qu'un fichier externe
      const audio = new Audio();
      // Utiliser une data URI pour un bip simple (optionnel)
      // Ou simplement désactiver le son en développement
      if (environment.production) {
        audio.src = '/assets/sounds/notification.mp3';
        audio.play().catch(() => console.log('Son de notification non disponible'));
      }
      // En développement, ne pas jouer de son
    } catch (error) {
      console.log('Lecture du son impossible');
    }
  }

  private showBrowserNotification(message: Message): void {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      // Éviter les doublons de notification
      const notificationKey = `notif-${message.id}`;
      if (sessionStorage.getItem(notificationKey)) return;
      sessionStorage.setItem(notificationKey, 'sent');
      setTimeout(() => sessionStorage.removeItem(notificationKey), 5000);
      
      new Notification('Nouveau message', {
        body: message.content || 'Vous avez reçu un message',
        icon: '/assets/icons/icon-72x72.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedFlag = false;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // Méthode pour réinitialiser les messages traités (utile en cas de déconnexion)
  resetProcessedMessages(): void {
    this.processedMessageIds.clear();
  }
}