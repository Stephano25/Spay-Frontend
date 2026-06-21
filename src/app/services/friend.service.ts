// src/app/services/friend.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, of } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

// Interfaces exportées
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked' | 'deleted';
  friend?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
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
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
  isBlocked?: boolean;
}

export interface FriendResponse {
  message: string;
  success: boolean;
  requestId?: string;
  conversationId?: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}

@Injectable({ providedIn: 'root' })
export class FriendService {
  private apiUrl = `${environment.apiUrl}/friends`;

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(this.apiUrl).pipe(
      catchError(this.handleError<Friend[]>('getFriends', []))
    );
  }

  getFriendRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests`).pipe(
      catchError(this.handleError<FriendRequest[]>('getFriendRequests', []))
    );
  }

  getSuggestions(): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.apiUrl}/suggestions`).pipe(
      catchError(this.handleError<SearchUser[]>('getSuggestions', []))
    );
  }

  getBlockedUsers(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/blocked`).pipe(
      catchError(this.handleError<Friend[]>('getBlockedUsers', []))
    );
  }

  searchUsers(query: string): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.apiUrl}/search`, { params: { q: query } }).pipe(
      catchError(this.handleError<SearchUser[]>('searchUsers', []))
    );
  }

  sendFriendRequest(friendId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/request/${friendId}`, {}).pipe(
      tap(res => this.notificationService.showSuccess(res.message || 'Demande envoyée')),
      catchError(this.handleError<FriendResponse>('sendFriendRequest'))
    );
  }

  acceptFriendRequest(requestId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/accept/${requestId}`, {}).pipe(
      tap(res => this.notificationService.showSuccess('Demande acceptée')),
      catchError(this.handleError<FriendResponse>('acceptFriendRequest'))
    );
  }

  declineFriendRequest(requestId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/decline/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Demande refusée')),
      catchError(this.handleError<FriendResponse>('declineFriendRequest'))
    );
  }

  removeFriend(friendId: string): Observable<FriendResponse> {
    return this.http.delete<FriendResponse>(`${this.apiUrl}/${friendId}`).pipe(
      tap(() => this.notificationService.showSuccess('Ami supprimé')),
      catchError(this.handleError<FriendResponse>('removeFriend'))
    );
  }

  blockUser(userId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/block/${userId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Utilisateur bloqué')),
      catchError(this.handleError<FriendResponse>('blockUser'))
    );
  }

  unblockUser(userId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/unblock/${userId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Utilisateur débloqué')),
      catchError(this.handleError<FriendResponse>('unblockUser'))
    );
  }

  checkBlockStatus(userId: string): Observable<BlockStatus> {
    return this.http.get<BlockStatus>(`${this.apiUrl}/block-status/${userId}`).pipe(
      catchError(this.handleError<BlockStatus>('checkBlockStatus', { isBlocked: false, canMessage: true }))
    );
  }

  findUsersByPhones(phones: string[]): Observable<SearchUser[]> {
    return this.http.post<SearchUser[]>(`${this.apiUrl}/find-by-phones`, { phones }).pipe(
      catchError(this.handleError<SearchUser[]>('findUsersByPhones', []))
    );
  }

  private handleError<T>(operation: string, fallback?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`❌ ${operation} échoué:`, error);
      const message = error.error?.message || `Erreur lors de ${operation}`;
      this.notificationService.showError(message);
      return of(fallback as T);
    };
  }
}