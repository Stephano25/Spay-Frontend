import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../anvironments/environment';

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  qrCode: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface FriendInvitation {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  sender?: {
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/friends`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des amis');
        return throwError(() => error);
      })
    );
  }

  getFriendRequests(): Observable<FriendInvitation[]> {
    return this.http.get<FriendInvitation[]>(`${this.apiUrl}/friends/requests`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des invitations');
        return throwError(() => error);
      })
    );
  }

  searchUsers(query: string): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/search?q=${query}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors de la recherche');
        return throwError(() => error);
      })
    );
  }

  sendFriendRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/request/${userId}`, {}).pipe(
      tap(() => this.notificationService.showSuccess('Invitation envoyée')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || "Erreur lors de l'envoi");
        return throwError(() => error);
      })
    );
  }

  acceptFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/accept/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showSuccess('Invitation acceptée')),
      catchError(error => {
        this.notificationService.showError("Erreur lors de l'acceptation");
        return throwError(() => error);
      })
    );
  }

  declineFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/decline/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Invitation refusée')),
      catchError(error => {
        this.notificationService.showError('Erreur lors du refus');
        return throwError(() => error);
      })
    );
  }

  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/friends/${friendId}`).pipe(
      tap(() => this.notificationService.showSuccess('Ami supprimé')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }

  getUserByQRCode(qrCode: string): Observable<Friend> {
    return this.http.get<Friend>(`${this.apiUrl}/qr/${qrCode}`).pipe(
      catchError(error => {
        this.notificationService.showError('QR Code invalide');
        return throwError(() => error);
      })
    );
  }

  getFriendStatus(friendId: string): Observable<{ isOnline: boolean; lastSeen?: Date }> {
    return this.http.get<{ isOnline: boolean; lastSeen?: Date }>(`${this.apiUrl}/status/${friendId}`);
  }
}