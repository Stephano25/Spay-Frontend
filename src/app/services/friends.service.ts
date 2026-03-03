import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  friend?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
}

export interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private apiUrl = `${environment.apiUrl}/friends`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Récupérer la liste des amis de l'utilisateur connecté
   */
  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des amis');
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les demandes d'amis reçues
   */
  getFriendRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des demandes');
        return throwError(() => error);
      })
    );
  }

  /**
   * Rechercher des utilisateurs
   */
  searchUsers(query: string): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${environment.apiUrl}/users/search?q=${query}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors de la recherche');
        return throwError(() => error);
      })
    );
  }

  /**
   * Envoyer une demande d'ami
   */
  sendFriendRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request/${userId}`, {}).pipe(
      tap(() => this.notificationService.showSuccess('Demande d\'ami envoyée')),
      catchError(error => {
        const message = error.error?.message || "Erreur lors de l'envoi de la demande";
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Accepter une demande d'ami
   */
  acceptFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accept/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showSuccess('Demande d\'ami acceptée')),
      catchError(error => {
        this.notificationService.showError("Erreur lors de l'acceptation");
        return throwError(() => error);
      })
    );
  }

  /**
   * Refuser une demande d'ami
   */
  declineFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/decline/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Demande d\'ami refusée')),
      catchError(error => {
        this.notificationService.showError('Erreur lors du refus');
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer un ami
   */
  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${friendId}`).pipe(
      tap(() => this.notificationService.showSuccess('Ami supprimé')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifier le statut d'amitié avec un utilisateur
   */
  checkFriendStatus(userId: string): Observable<{ status: 'none' | 'pending' | 'friends' }> {
    return this.http.get<{ status: 'none' | 'pending' | 'friends' }>(`${this.apiUrl}/status/${userId}`).pipe(
      catchError(error => {
        console.error('Erreur vérification statut:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les suggestions d'amis
   */
  getFriendSuggestions(): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.apiUrl}/suggestions`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des suggestions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtenir le statut en ligne d'un ami
   */
  getFriendOnlineStatus(friendId: string): Observable<{ isOnline: boolean; lastSeen?: Date }> {
    return this.http.get<{ isOnline: boolean; lastSeen?: Date }>(`${environment.apiUrl}/users/status/${friendId}`).pipe(
      catchError(error => {
        console.error('Erreur statut en ligne:', error);
        return throwError(() => error);
      })
    );
  }
}