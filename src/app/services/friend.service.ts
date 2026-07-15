// frontend/src/app/services/friend.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, of, throwError, timeout, map } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ──────────────────────────────────────────────
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked' | 'deleted';
  createdAt?: Date;
  updatedAt?: Date;
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
  createdAt: Date;
  updatedAt?: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  receiver?: {
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
  blockedBy?: string;
}

export interface FriendResponse {
  message: string;
  success: boolean;
  requestId?: string;
  conversationId?: string;
  data?: any;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedBy?: string;
  canMessage: boolean;
}

// ── Service ──────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FriendService {
  private apiUrl = `${environment.apiUrl}/friends`;
  private readonly TIMEOUT_MS = 30000; // 30 secondes

  constructor(
    private http: HttpClient,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ Aucun token trouvé dans le localStorage');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  private handleError<T>(operation: string, fallback?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`❌ [FriendService] ${operation} failed:`, {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });

      // Messages d'erreur spécifiques
      let errorMessage = 'Une erreur est survenue';
      if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      } else if (error.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        errorMessage = 'Accès non autorisé.';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      // Retourner l'erreur avec le message
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    };
  }

  private handleSuccess<T>(operation: string) {
    return (data: T): void => {
      console.log(`✅ [FriendService] ${operation} successful:`, data);
    };
  }

  // ============================================================
  // RÉCUPÉRATION DES DONNÉES
  // ============================================================

  /**
   * Récupère la liste des amis de l'utilisateur connecté
   */
  getFriends(): Observable<Friend[]> {
    const ts = new Date().getTime();
    console.log('📋 Récupération de la liste des amis...');
    
    return this.http.get<Friend[]>(`${this.apiUrl}?_=${ts}`, { 
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data: Friend[]) => {
        console.log(`📋 ${data?.length || 0} amis récupérés`);
        if (data && data.length > 0) {
          console.log('📋 Premier ami:', data[0]);
        }
      }),
      catchError(this.handleError<Friend[]>('getFriends', []))
    );
  }

  /**
   * Récupère les demandes d'amis reçues et envoyées
   * CORRECTION: Maintenant récupère TOUTES les demandes
   */
  getFriendRequests(): Observable<FriendRequest[]> {
    console.log('📩 Récupération des demandes d\'amis...');
    
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests`, { 
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data: FriendRequest[]) => {
        console.log(`📩 ${data?.length || 0} demandes d'ami récupérées`);
        
        if (data && data.length > 0) {
          console.log('📩 Détail des demandes:', JSON.stringify(data, null, 2));
          
          // Vérifier la structure des données
          data.forEach((req, index) => {
            console.log(`📩 Demande ${index + 1}:`, {
              id: req.id,
              senderId: req.senderId,
              receiverId: req.receiverId,
              status: req.status,
              createdAt: req.createdAt,
              hasSender: !!req.sender,
              senderName: req.sender ? `${req.sender.firstName} ${req.sender.lastName}` : '❌ Sender manquant',
              senderEmail: req.sender?.email || '❌ Email manquant'
            });
          });
        } else {
          console.log('📩 Aucune demande d\'ami trouvée');
        }
      }),
      catchError(this.handleError<FriendRequest[]>('getFriendRequests', []))
    );
  }

  /**
   * Récupère les suggestions d'amis
   */
  getSuggestions(): Observable<SearchUser[]> {
    console.log('💡 Récupération des suggestions...');
    
    return this.http.get<SearchUser[]>(`${this.apiUrl}/suggestions`, { 
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data: SearchUser[]) => {
        console.log(`💡 ${data?.length || 0} suggestions récupérées`);
      }),
      catchError(this.handleError<SearchUser[]>('getSuggestions', []))
    );
  }

  /**
   * Récupère la liste des utilisateurs bloqués
   */
  getBlockedUsers(): Observable<Friend[]> {
    console.log('🚫 Récupération des utilisateurs bloqués...');
    
    return this.http.get<Friend[]>(`${this.apiUrl}/blocked`, { 
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data: Friend[]) => {
        console.log(`🚫 ${data?.length || 0} utilisateurs bloqués récupérés`);
      }),
      catchError(this.handleError<Friend[]>('getBlockedUsers', []))
    );
  }

  /**
   * Recherche des utilisateurs par nom, email ou téléphone
   */
  searchUsers(query: string): Observable<SearchUser[]> {
    if (!query || query.trim().length < 2) {
      console.log('⚠️ Requête de recherche trop courte');
      return of([]);
    }
    
    console.log(`🔍 Recherche d'utilisateurs: "${query}"`);
    
    return this.http.get<SearchUser[]>(`${this.apiUrl}/search`, { 
      params: { q: query.trim() },
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data: SearchUser[]) => {
        console.log(`🔍 ${data?.length || 0} résultats pour "${query}"`);
      }),
      catchError(this.handleError<SearchUser[]>('searchUsers', []))
    );
  }

  /**
   * Recherche des utilisateurs par numéros de téléphone
   */
  findUsersByPhones(phones: string[]): Observable<SearchUser[]> {
    if (!phones || phones.length === 0) {
      console.log('⚠️ Aucun numéro de téléphone fourni');
      return of([]);
    }
    
    console.log(`📱 Recherche d'utilisateurs par téléphone: ${phones.length} numéros`);
    
    return this.http.post<SearchUser[]>(
      `${this.apiUrl}/find-by-phones`,
      { phones: phones.map(p => p.replace(/\s/g, '')) },
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data: SearchUser[]) => {
        console.log(`📱 ${data?.length || 0} utilisateurs trouvés par téléphone`);
      }),
      catchError(this.handleError<SearchUser[]>('findUsersByPhones', []))
    );
  }

  // ============================================================
  // ACTIONS - DEMANDES D'AMIS
  // ============================================================

  /**
   * Envoie une demande d'ami
   */
  sendFriendRequest(friendId: string): Observable<FriendResponse> {
    if (!friendId) {
      console.error('❌ ID de l\'ami manquant');
      return throwError(() => new Error('ID de l\'ami manquant'));
    }
    
    console.log(`📤 Envoi de demande d'ami à: ${friendId}`);
    
    return this.http.post<FriendResponse>(
      `${this.apiUrl}/request/${friendId}`,
      {},
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((response) => {
        console.log('✅ Demande envoyée avec succès:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur envoi demande:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Accepte une demande d'ami
   */
  acceptFriendRequest(requestId: string): Observable<FriendResponse> {
    if (!requestId) {
      console.error('❌ ID de la demande manquant');
      return throwError(() => new Error('ID de la demande manquant'));
    }
    
    console.log(`✅ Acceptation de la demande: ${requestId}`);
    
    return this.http.post<FriendResponse>(
      `${this.apiUrl}/accept/${requestId}`,
      {},
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((response) => {
        console.log('✅ Demande acceptée avec succès:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur acceptation demande:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refuse une demande d'ami
   */
  declineFriendRequest(requestId: string): Observable<FriendResponse> {
    if (!requestId) {
      console.error('❌ ID de la demande manquant');
      return throwError(() => new Error('ID de la demande manquant'));
    }
    
    console.log(`❌ Refus de la demande: ${requestId}`);
    
    return this.http.post<FriendResponse>(
      `${this.apiUrl}/decline/${requestId}`,
      {},
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((response) => {
        console.log('✅ Demande refusée avec succès:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur refus demande:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // ACTIONS - GESTION DES AMIS
  // ============================================================

  /**
   * Supprime un ami de la liste
   */
  removeFriend(friendId: string): Observable<FriendResponse> {
    if (!friendId) {
      console.error('❌ ID de l\'ami manquant');
      return throwError(() => new Error('ID de l\'ami manquant'));
    }
    
    console.log(`🗑️ Suppression de l'ami: ${friendId}`);
    
    return this.http.delete<FriendResponse>(
      `${this.apiUrl}/${friendId}`,
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((response) => {
        console.log('✅ Ami supprimé avec succès:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur suppression ami:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // ACTIONS - BLOCAGE
  // ============================================================

  /**
   * Bloque un utilisateur
   */
  blockUser(userId: string): Observable<FriendResponse> {
    if (!userId) {
      console.error('❌ ID de l\'utilisateur manquant');
      return throwError(() => new Error('ID de l\'utilisateur manquant'));
    }
    
    console.log(`🚫 Blocage de l'utilisateur: ${userId}`);
    
    return this.http.post<FriendResponse>(
      `${this.apiUrl}/block/${userId}`,
      {},
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((response) => {
        console.log('✅ Utilisateur bloqué avec succès:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur blocage utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Débloque un utilisateur
   */
  unblockUser(userId: string): Observable<FriendResponse> {
    if (!userId) {
      console.error('❌ ID de l\'utilisateur manquant');
      return throwError(() => new Error('ID de l\'utilisateur manquant'));
    }
    
    console.log(`🔓 Déblocage de l'utilisateur: ${userId}`);
    
    return this.http.post<FriendResponse>(
      `${this.apiUrl}/unblock/${userId}`,
      {},
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((response) => {
        console.log('✅ Utilisateur débloqué avec succès:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur déblocage utilisateur:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie le statut de blocage entre deux utilisateurs
   */
  checkBlockStatus(userId: string): Observable<BlockStatus> {
    if (!userId) {
      console.error('❌ ID de l\'utilisateur manquant');
      return of({ isBlocked: false, canMessage: true });
    }
    
    console.log(`🔍 Vérification du statut de blocage pour: ${userId}`);
    
    return this.http.get<BlockStatus>(
      `${this.apiUrl}/block-status/${userId}`,
      { 
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      tap((data) => {
        console.log(`🔍 Statut de blocage:`, data);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur vérification blocage:', error);
        return of({ isBlocked: false, canMessage: true });
      })
    );
  }

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * Rafraîchit toutes les données des amis
   */
  refreshAllData(): Observable<Friend[]> {
    console.log('🔄 Rafraîchissement des données des amis...');
    return this.getFriends();
  }

  /**
   * Vérifie si un utilisateur est déjà dans la liste d'amis
   * CORRECTION: Utilisation de map pour transformer le résultat en boolean
   */
  isFriend(userId: string): Observable<boolean> {
    if (!userId) {
      console.error('❌ ID de l\'utilisateur manquant');
      return of(false);
    }
    
    console.log(`🔍 Vérification si ${userId} est un ami...`);
    
    return this.getFriends().pipe(
      map((friends: Friend[]) => {
        // Vérifier si l'utilisateur est dans la liste des amis
        const found = friends.some(f => f.friend?.id === userId || f.friendId === userId);
        console.log(`🔍 ${userId} est ${found ? '✅' : '❌'} un ami`);
        return found;
      }),
      catchError((error) => {
        console.error('❌ Erreur vérification ami:', error);
        return of(false);
      })
    );
  }

  /**
   * Vérifie si une demande d'ami est déjà en attente
   */
  hasPendingRequest(userId: string): Observable<boolean> {
    if (!userId) {
      console.error('❌ ID de l\'utilisateur manquant');
      return of(false);
    }
    
    console.log(`🔍 Vérification si une demande est en attente pour ${userId}...`);
    
    return this.getFriendRequests().pipe(
      map((requests: FriendRequest[]) => {
        // Vérifier si une demande est en attente pour cet utilisateur
        const found = requests.some(r => 
          (r.senderId === userId || r.receiverId === userId) && 
          (r.status === 'pending' || r.status === 'PENDING')
        );
        console.log(`🔍 Demande en attente pour ${userId}: ${found ? '✅' : '❌'}`);
        return found;
      }),
      catchError((error) => {
        console.error('❌ Erreur vérification demande en attente:', error);
        return of(false);
      })
    );
  }

  /**
   * Récupère les détails d'un ami par son ID
   */
  getFriendById(friendId: string): Observable<Friend | undefined> {
    if (!friendId) {
      console.error('❌ ID de l\'ami manquant');
      return of(undefined);
    }
    
    console.log(`🔍 Recherche de l'ami ${friendId}...`);
    
    return this.getFriends().pipe(
      map((friends: Friend[]) => {
        const found = friends.find(f => f.friend?.id === friendId || f.friendId === friendId);
        console.log(`🔍 Ami ${friendId}: ${found ? '✅ trouvé' : '❌ non trouvé'}`);
        return found;
      }),
      catchError((error) => {
        console.error('❌ Erreur recherche ami:', error);
        return of(undefined);
      })
    );
  }
}