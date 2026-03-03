import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { Friend, FriendRequest, SearchUser, FriendResponse } from '../models/friend.model'; // IMPORTER DEPUIS LES MODÈLES

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = `${environment.apiUrl}/friends`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  /**
   * Récupérer la liste des amis
   */
  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(this.apiUrl).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des amis');
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les demandes d'amis
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
   * Récupérer les suggestions d'amis
   */
  getSuggestions(): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.apiUrl}/suggestions`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des suggestions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Rechercher des utilisateurs
   */
  searchUsers(query: string): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    }).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors de la recherche');
        return throwError(() => error);
      })
    );
  }

  /**
   * Envoyer une demande d'ami
   */
  sendFriendRequest(friendId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/request/${friendId}`, {}).pipe(
      tap(() => this.notificationService.showSuccess('Demande d\'ami envoyée')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de l\'envoi');
        return throwError(() => error);
      })
    );
  }

  /**
   * Accepter une demande d'ami
   */
  acceptFriendRequest(requestId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/accept/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showSuccess('Demande d\'ami acceptée')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de l\'acceptation');
        return throwError(() => error);
      })
    );
  }

  /**
   * Refuser une demande d'ami
   */
  declineFriendRequest(requestId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/decline/${requestId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Demande d\'ami refusée')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du refus');
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer un ami
   */
  removeFriend(friendId: string): Observable<FriendResponse> {
    return this.http.delete<FriendResponse>(`${this.apiUrl}/${friendId}`).pipe(
      tap(() => this.notificationService.showSuccess('Ami supprimé')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }
}