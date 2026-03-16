import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { FriendService } from './friend.service';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

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
  
  // Observables
  private newMessageSubject = new BehaviorSubject<Message | null>(null);
  private typingSubject = new BehaviorSubject<TypingIndicator | null>(null);
  private onlineStatusSubject = new BehaviorSubject<{ userId: string; isOnline: boolean; lastSeen?: Date } | null>(null);
  private blockStatusSubject = new BehaviorSubject<{ userId: string; isBlocked: boolean; blockedBy?: string } | null>(null);
  
  public newMessage$ = this.newMessageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();
  public blockStatus$ = this.blockStatusSubject.asObservable();

  private currentUserId: string = '';

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
  }

  /**
   * Connexion au socket
   */
  private connectSocket(): void {
    const token = this.authService.getToken();
    
    if (!token) return;

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
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket déconnecté');
      });

      this.socket.on('newMessage', (message: Message) => {
        console.log('📨 Nouveau message reçu:', message);
        this.newMessageSubject.next(message);
        this.playNotificationSound();
        
        if (document.hidden) {
          this.showBrowserNotification(message);
        }
      });

      this.socket.on('messageSent', (message: Message) => {
        console.log('✅ Message envoyé:', message);
      });

      this.socket.on('userTyping', (data: TypingIndicator) => {
        this.typingSubject.next(data);
      });

      this.socket.on('userOnline', (data: { userId: string; isOnline: boolean }) => {
        console.log('🟢 Statut en ligne:', data);
        this.onlineStatusSubject.next(data);
      });

      this.socket.on('onlineUsers', (users: string[]) => {
        console.log('👥 Utilisateurs en ligne:', users);
      });

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

  /**
   * Récupérer les conversations
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      tap(convs => console.log('📋 Conversations chargées:', convs)),
      catchError(error => {
        console.error('❌ Erreur chargement conversations:', error);
        return of([]);
      })
    );
  }

  /**
  * Récupérer les messages avec un utilisateur
  */
  getMessages(userId: string): Observable<Message[]> {
    if (!userId) {
      console.error('❌ getMessages appelé avec userId undefined');
      return of([]);
   }
  
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`).pipe(
      tap(msgs => console.log(`📋 Messages avec ${userId}:`, msgs)),
      catchError(error => {
        console.error('❌ Erreur chargement messages:', error);
        return of([]);
      })
    );
  }

  /**
   * Envoyer un message
   */
  sendMessage(message: {
    receiverId: string;
    type: 'text' | 'image' | 'file' | 'emoji' | 'money';
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    emoji?: string;
    moneyTransfer?: {
      amount: number;
    };
  }): void {
    if (!this.socket || !this.socket.connected) {
      this.notificationService.showError('Connexion perdue, tentative de reconnexion...');
      this.connectSocket();
      setTimeout(() => this.sendMessage(message), 1000);
      return;
    }

    this.socket.emit('sendMessage', message);
  }

  /**
   * Envoyer un indicateur de frappe
   */
  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  /**
   * Marquer les messages comme lus
   */
  markAsRead(senderId: string): Observable<void> {
    if (!senderId) {
      console.error('❌ markAsRead appelé avec senderId undefined');
      return of(void 0);
    }
  
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {}).pipe(
      tap(() => {
        if (this.socket?.connected) {
          this.socket.emit('markAsRead', { senderId });
        }
      }),
      catchError(error => {
        console.error('❌ Erreur markAsRead:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Uploader un fichier
   */
  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(
      `${this.apiUrl}/upload`,
      formData
    ).pipe(
      tap(result => console.log('✅ Fichier uploadé:', result)),
      catchError(error => {
        console.error('❌ Erreur upload:', error);
        this.notificationService.showError('Erreur lors de l\'upload');
        return of({ url: '', fileName: '', fileSize: 0 });
      })
    );
  }

  /**
   * Rechercher des utilisateurs
   */
  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/search`, {
      params: { q: query }
    }).pipe(
      catchError(error => {
        console.error('❌ Erreur recherche:', error);
        return of([]);
      })
    );
  }

  /**
   * Jouer un son de notification
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.play().catch(() => {});
    } catch (error) {}
  }

  /**
   * Afficher une notification du navigateur
   */
  private showBrowserNotification(message: Message): void {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('Nouveau message', {
        body: message.content || 'Vous avez reçu un message',
        icon: '/assets/icons/icon-72x72.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  /**
   * Demander la permission de notification
   */
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  /**
   * Déconnecter le socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Vérifier si le socket est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
 * Mettre à jour un message
 */
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

/**
 * Supprimer un message
 */
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
}