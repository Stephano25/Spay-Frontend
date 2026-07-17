import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connected = false;
  private connectionSubject = new Subject<boolean>();

  constructor() {
    this.initSocket();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Initialise la connexion socket
   */
  private initSocket(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ [SocketService] Pas de token disponible');
      return;
    }

    // ✅ Utiliser l'URL de base SANS /api
    const socketUrl = environment.socketUrl || 'http://localhost:3000';
    
    console.log(`🔌 [SocketService] Connexion à ${socketUrl}...`);
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('✅ [SocketService] Connecté au serveur WebSocket');
      this.connected = true;
      this.connectionSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 [SocketService] Déconnecté du serveur WebSocket');
      this.connected = false;
      this.connectionSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [SocketService] Erreur de connexion:', error);
      this.connected = false;
    });
  }

  /**
   * Se connecte au serveur
   */
  connect(): void {
    if (this.socket && !this.connected) {
      this.socket.connect();
    } else if (!this.socket) {
      this.initSocket();
    }
  }

  /**
   * Se déconnecte du serveur
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Émet un événement vers le serveur
   */
  emit(event: string, data: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ [SocketService] Impossible d'émettre ${event}, socket non connecté`);
    }
  }

  /**
   * Écoute un événement du serveur
   */
  on(event: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket non initialisé');
        return;
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket.on(event, handler);

      return () => {
        if (this.socket) {
          this.socket.off(event, handler);
        }
      };
    });
  }

  /**
   * Écoute un événement une seule fois
   */
  once(event: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket non initialisé');
        return;
      }

      const handler = (data: any) => {
        observer.next(data);
        observer.complete();
      };

      this.socket.once(event, handler);

      return () => {
        if (this.socket) {
          this.socket.off(event, handler);
        }
      };
    });
  }

  /**
   * Arrête d'écouter un événement
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Rejoint une room
   */
  joinRoom(roomId: string): void {
    this.emit('joinRoom', { roomId });
  }

  /**
   * Quitte une room
   */
  leaveRoom(roomId: string): void {
    this.emit('leaveRoom', { roomId });
  }

  /**
   * Vérifie si la socket est connectée
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected || false;
  }

  /**
   * Obtient l'ID de la socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Observable de l'état de connexion
   */
  onConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }
}