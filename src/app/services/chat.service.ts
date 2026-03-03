import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

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
}

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
  
  public newMessage$ = this.newMessageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();
  public callSignal$ = this.callSignalSubject.asObservable();

  private currentUserId: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
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

    } catch (error) {
      console.error('Erreur de connexion socket:', error);
    }
  }

  /**
   * Récupérer les conversations
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  /**
   * Récupérer les messages avec un utilisateur
   */
  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`);
  }

  /**
   * Envoyer un message
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
    if (this.socket) {
      this.socket.emit('sendMessage', message);
    } else {
      // Fallback HTTP si socket non connecté
      this.http.post(`${this.apiUrl}/send`, message).subscribe();
    }
  }

  /**
   * Envoyer un indicateur de frappe
   */
  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
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
   * Démarrer un appel
   */
  startCall(receiverId: string, type: 'video' | 'audio'): void {
    if (this.socket) {
      this.socket.emit('startCall', { receiverId, type });
    }
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