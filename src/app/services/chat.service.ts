import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { FriendService } from './friend.service';
import { environment } from '../../environments/environment';
import { switchMap, catchError } from 'rxjs/operators';

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
  isBlocked?: boolean; // Indique si le message n'a pas été envoyé à cause d'un blocage
}

// Ajoutez ou mettez à jour cette interface dans votre chat.service.ts

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage: Message;
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

export interface CallSignal {
  type: 'video' | 'audio';
  signal: any;
  callerId: string;
  callerName: string;
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
  private callSignalSubject = new BehaviorSubject<CallSignal | null>(null);
  private blockStatusSubject = new BehaviorSubject<{ userId: string; isBlocked: boolean; blockedBy?: string } | null>(null);
  
  public newMessage$ = this.newMessageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();
  public callSignal$ = this.callSignalSubject.asObservable();
  public blockStatus$ = this.blockStatusSubject.asObservable();

  private currentUserId: string = '';
  private blockStatusCache: Map<string, boolean> = new Map();

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
        console.log('Socket connecté');
      });

      this.socket.on('newMessage', (message: Message) => {
        this.newMessageSubject.next(message);
        this.playNotificationSound();
        
        if (document.hidden) {
          this.showBrowserNotification(message);
        }
      });

      this.socket.on('typing', (data: TypingIndicator) => {
        this.typingSubject.next(data);
      });

      this.socket.on('userStatus', (data: { userId: string; isOnline: boolean; lastSeen?: Date }) => {
        this.onlineStatusSubject.next(data);
      });

      this.socket.on('callSignal', (data: CallSignal) => {
        this.callSignalSubject.next(data);
      });

      this.socket.on('userBlocked', (data: { userId: string; blockedBy: string }) => {
        this.blockStatusSubject.next({ userId: data.userId, isBlocked: true, blockedBy: data.blockedBy });
        this.blockStatusCache.set(data.userId, true);
      });

      this.socket.on('userUnblocked', (data: { userId: string }) => {
        this.blockStatusSubject.next({ userId: data.userId, isBlocked: false });
        this.blockStatusCache.set(data.userId, false);
      });

      this.socket.on('messageBlocked', (data: { receiverId: string; reason: string }) => {
        this.notificationService.showWarning('Message non envoyé : vous avez bloqué cet utilisateur ou vous êtes bloqué');
      });

    } catch (error) {
      console.error('Erreur de connexion socket:', error);
    }
  }

  /**
   * Récupérer les conversations avec statut de blocage
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Récupérer les messages avec un utilisateur (avec vérification blocage)
   */
  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`).pipe(
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Envoyer un message avec vérification de blocage
   */
  sendMessage(message: {
    receiverId: string;
    type: 'text' | 'image' | 'file' | 'voice' | 'emoji' | 'money';
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    emoji?: string;
    moneyTransfer?: {
      amount: number;
    };
  }): void {
    // Vérifier d'abord le statut de blocage
    this.friendService.checkBlockStatus(message.receiverId).subscribe({
      next: (status) => {
        if (status.isBlocked) {
          this.notificationService.showWarning('Impossible d\'envoyer un message : vous avez bloqué cet utilisateur ou vous êtes bloqué');
          // Émettre un message d'erreur
          const blockedMessage: Message = {
            id: 'blocked-' + Date.now(),
            senderId: this.currentUserId,
            receiverId: message.receiverId,
            type: message.type,
            content: message.content,
            createdAt: new Date(),
            isRead: false,
            isDelivered: false,
            isBlocked: true
          };
          this.newMessageSubject.next(blockedMessage);
        } else {
          // Envoyer le message normalement
          if (this.socket) {
            this.socket.emit('sendMessage', message);
          } else {
            // Fallback HTTP
            this.http.post(`${this.apiUrl}/send`, message).subscribe();
          }
        }
      },
      error: () => {
        // En cas d'erreur, tenter d'envoyer quand même
        if (this.socket) {
          this.socket.emit('sendMessage', message);
        }
      }
    });
  }

  /**
   * Envoyer un indicateur de frappe (vérifie le blocage)
   */
  sendTyping(receiverId: string, isTyping: boolean): void {
    this.friendService.checkBlockStatus(receiverId).subscribe({
      next: (status) => {
        if (!status.isBlocked && this.socket) {
          this.socket.emit('typing', { receiverId, isTyping });
        }
      },
      error: () => {
        if (this.socket) {
          this.socket.emit('typing', { receiverId, isTyping });
        }
      }
    });
  }

  /**
   * Marquer les messages comme lus
   */
  markAsRead(senderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read/${senderId}`, {});
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
    );
  }

  /**
   * Démarrer un appel (vérifie le blocage)
   */
  startCall(receiverId: string, type: 'video' | 'audio'): void {
    this.friendService.checkBlockStatus(receiverId).subscribe({
      next: (status) => {
        if (status.isBlocked) {
          this.notificationService.showWarning('Impossible d\'appeler : vous avez bloqué cet utilisateur ou vous êtes bloqué');
        } else if (this.socket) {
          this.socket.emit('startCall', { receiverId, type });
        }
      },
      error: () => {
        if (this.socket) {
          this.socket.emit('startCall', { receiverId, type });
        }
      }
    });
  }

  /**
   * Rechercher des utilisateurs
   */
  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/search?q=${query}`);
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
}