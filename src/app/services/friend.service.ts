import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, of } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { Friend, FriendRequest, SearchUser, FriendResponse, BlockStatus } from '../models/friend.model';

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
  * Récupérer la liste des amis (uniquement acceptés)
  */
  getFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}`).pipe(
      tap(friends => console.log('Amis chargés:', friends)),
      catchError(error => {
        console.error('Erreur chargement amis:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupérer les demandes d'amis
   */
  getFriendRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests`).pipe(
      tap(requests => console.log('Demandes reçues du serveur:', requests)),
      catchError(error => {
        console.error('Erreur chargement demandes:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupérer les suggestions d'amis
   */
  getSuggestions(): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.apiUrl}/suggestions`).pipe(
      catchError(error => {
        console.error('Erreur chargement suggestions:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupérer la liste des utilisateurs bloqués
   */
  getBlockedUsers(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/blocked`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.warn('Route /blocked non disponible, retour tableau vide');
          return of([]);
        }
        console.error('Erreur chargement bloqués:', error);
        return of([]);
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
        console.error('Erreur recherche:', error);
        return of([]);
      })
    );
  }

  /**
   * Envoyer une demande d'ami
   */
  sendFriendRequest(friendId: string): Observable<FriendResponse> {
    console.log('Envoi demande à:', friendId);
    
    return this.http.post<FriendResponse>(`${this.apiUrl}/request/${friendId}`, {}).pipe(
      tap((response) => {
        console.log('✅ Réponse succès:', response);
        this.notificationService.showSuccess(response.message || 'Demande d\'ami envoyée');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur détaillée:', error);
        
        let errorMessage = 'Erreur lors de l\'envoi';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Impossible d\'envoyer la demande';
        } else if (error.status === 403) {
          errorMessage = 'Vous ne pouvez pas envoyer de demande à cet utilisateur';
        } else if (error.status === 404) {
          errorMessage = 'Utilisateur non trouvé';
        }
        
        this.notificationService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Accepter une demande d'ami
   */
  acceptFriendRequest(requestId: string): Observable<FriendResponse> {
    console.log('Acceptation demande:', requestId);
    
    return this.http.post<FriendResponse>(`${this.apiUrl}/accept/${requestId}`, {}).pipe(
      tap((response) => {
        console.log('✅ Réponse acceptation:', response);
        this.notificationService.showSuccess('Demande d\'ami acceptée');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur détaillée:', error);
        
        let errorMessage = 'Erreur lors de l\'acceptation';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Demande invalide ou déjà traitée';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'êtes pas autorisé à accepter cette demande';
        } else if (error.status === 404) {
          errorMessage = 'Demande non trouvée';
        }
        
        this.notificationService.showError(errorMessage);
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
        console.error('Erreur refus:', error);
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
        console.error('Erreur suppression:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Bloquer un utilisateur
   */
  blockUser(userId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/block/${userId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Utilisateur bloqué')),
      catchError(error => {
        console.error('Erreur blocage:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Débloquer un utilisateur
   */
  unblockUser(userId: string): Observable<FriendResponse> {
    return this.http.post<FriendResponse>(`${this.apiUrl}/unblock/${userId}`, {}).pipe(
      tap(() => this.notificationService.showInfo('Utilisateur débloqué')),
      catchError(error => {
        console.error('Erreur déblocage:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifier le statut de blocage avec un utilisateur
   */
  checkBlockStatus(userId: string): Observable<BlockStatus> {
    return this.http.get<BlockStatus>(`${this.apiUrl}/block-status/${userId}`).pipe(
      catchError(error => {
        console.error('Erreur vérification blocage:', error);
        return throwError(() => error);
      })
    );
  }
}