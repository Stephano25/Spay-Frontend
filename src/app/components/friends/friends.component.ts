import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Services
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { FriendService } from '../../services/friend.service';

// Models
import { Friend, FriendRequest, SearchUser } from '../../models/friend.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit, OnDestroy {
  // États
  friends: Friend[] = [];
  friendRequests: FriendRequest[] = [];
  searchResults: SearchUser[] = [];
  suggestions: SearchUser[] = [];
  blockedUsers: Friend[] = [];
  
  // UI
  showAddFriend = false;
  showBlockedUsers = false;
  searchQuery = '';
  isLoading = true;
  isSearching = false;
  selectedTabIndex = 0;
  
  // Utilisateur courant
  currentUserId: string = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private friendService: FriendService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charger toutes les données
   */
  loadData(): void {
    this.isLoading = true;
    
    // Charger les amis
    this.subscriptions.push(
      this.friendService.getFriends().pipe(
        catchError(error => {
          console.error('Erreur chargement amis:', error);
          return of([]);
        })
      ).subscribe(friends => {
        this.friends = friends.filter(f => f.status === 'accepted');
        console.log('Amis chargés:', this.friends);
      })
    );

    // Charger les demandes d'amis
    this.subscriptions.push(
      this.friendService.getFriendRequests().pipe(
        catchError(error => {
          console.error('Erreur chargement demandes:', error);
          return of([]);
        })
      ).subscribe(requests => {
        this.friendRequests = requests;
        console.log('Demandes reçues:', this.friendRequests);
      })
    );

    // Charger les suggestions
    this.subscriptions.push(
      this.friendService.getSuggestions().pipe(
        catchError(error => {
          console.error('Erreur chargement suggestions:', error);
          return of([]);
        })
      ).subscribe(suggestions => {
        this.suggestions = suggestions;
        console.log('Suggestions chargées:', this.suggestions);
      })
    );

    // Charger les bloqués
    this.subscriptions.push(
      this.friendService.getBlockedUsers().pipe(
        catchError(error => {
          console.error('Erreur chargement bloqués:', error);
          return of([]);
        })
      ).subscribe(blocked => {
        this.blockedUsers = blocked;
        console.log('Bloqués chargés:', this.blockedUsers);
        this.isLoading = false;
      })
    );
  }

  /**
   * Rechercher des utilisateurs
   */
  onSearch(): void {
    if (!this.searchQuery.trim() || this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    
    this.friendService.searchUsers(this.searchQuery).pipe(
      catchError(error => {
        console.error('Erreur recherche:', error);
        this.isSearching = false;
        return of([]);
      })
    ).subscribe(results => {
      this.searchResults = results;
      console.log('Résultats recherche:', this.searchResults);
      this.isSearching = false;
    });
  }

  /**
   * Envoyer une demande d'ami
   */
  sendFriendRequest(userId: string): void {
    console.log('Envoi demande à:', userId);
  
    this.friendService.sendFriendRequest(userId).subscribe({
      next: (response) => {
        console.log('Réponse:', response);
      
        // Mettre à jour l'UI immédiatement
        const user = this.searchResults.find(u => u.id === userId);
        if (user) {
          user.hasPendingRequest = true;
        }
        
        const suggestion = this.suggestions.find(u => u.id === userId);
        if (suggestion) {
          suggestion.hasPendingRequest = true;
        }
      
        // Recharger les données
        setTimeout(() => {
          this.loadData();
        }, 500);
      },
      error: (error) => {
        console.error('Erreur envoi demande:', error);
      }
    });
  }

  /**
   * Accepter une demande d'ami
   */
  acceptRequest(requestId: string): void {
    console.log('Acceptation demande:', requestId);
  
    this.friendService.acceptFriendRequest(requestId).subscribe({
      next: (response) => {
        console.log('Réponse acceptation:', response);
      
        // Retirer la demande de la liste
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
      
        // Recharger les amis
        this.friendService.getFriends().subscribe(friends => {
          this.friends = friends.filter(f => f.status === 'accepted');
          console.log('Nouvelle liste amis:', this.friends);
        });
      
        this.notificationService.showSuccess('Demande d\'ami acceptée');
      
        // Rediriger vers le chat si une conversation a été créée
        if (response?.conversationId) {
          setTimeout(() => {
            this.router.navigate(['/chat'], { 
              queryParams: { conversationId: response.conversationId } 
            });
          }, 1500);
        }
      },
      error: (error) => {
        console.error('Erreur acceptation:', error);
        this.loadData(); // Recharger pour voir l'état actuel
      }
    });
  }

  /**
   * Refuser une demande d'ami
   */
  declineRequest(requestId: string): void {
    this.friendService.declineFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.notificationService.showInfo('Demande d\'ami refusée');
      },
      error: (error) => {
        console.error('Erreur refus:', error);
      }
    });
  }

  /**
   * Supprimer un ami
   */
  removeFriend(friendId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cet ami ?')) {
      this.friendService.removeFriend(friendId).subscribe({
        next: () => {
          this.friends = this.friends.filter(f => f.id !== friendId);
          this.notificationService.showSuccess('Ami supprimé');
          this.loadData();
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
        }
      });
    }
  }

  /**
   * Bloquer un utilisateur
   */
  blockUser(userId: string, userName: string): void {
    if (confirm(`Voulez-vous vraiment bloquer ${userName} ?`)) {
      this.friendService.blockUser(userId).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.showInfo(`${userName} a été bloqué`);
        },
        error: (error) => {
          console.error('Erreur blocage:', error);
        }
      });
    }
  }

  /**
   * Débloquer un utilisateur
   */
  unblockUser(userId: string, userName: string): void {
    if (confirm(`Voulez-vous vraiment débloquer ${userName} ?`)) {
      this.friendService.unblockUser(userId).subscribe({
        next: () => {
          this.blockedUsers = this.blockedUsers.filter(b => b.friendId !== userId && b.userId !== userId);
          this.notificationService.showInfo(`${userName} a été débloqué`);
          this.loadData();
        },
        error: (error) => {
          console.error('Erreur déblocage:', error);
        }
      });
    }
  }

  /**
   * Naviguer vers le chat avec un ami
   */
  chatWithFriend(friendId: string): void {
    this.router.navigate(['/chat'], { queryParams: { friendId } });
  }

  /**
   * Envoyer de l'argent à un ami
   */
  sendMoneyToFriend(friendId: string, friendName: string): void {
    this.router.navigate(['/transactions/send'], { 
      queryParams: { 
        friendId, 
        friendName 
      } 
    });
  }

  /**
   * Voir le profil d'un ami
   */
  viewFriendProfile(friendId: string): void {
    this.router.navigate(['/profile', friendId]);
  }

  /**
   * Scanner un QR code pour ajouter un ami
   */
  scanQRCode(): void {
    this.router.navigate(['/scan-friend']);
  }

  /**
   * Obtenir les initiales pour l'avatar
   */
  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }

  /**
   * Formater la date de dernière connexion
   */
  formatLastSeen(date?: Date): string {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const lastSeen = new Date(date);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return lastSeen.toLocaleDateString('fr-MG');
  }

  /**
   * Obtenir la couleur de l'avatar basée sur le nom
   */
  getAvatarColor(name: string): string {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
      '#cddc39', '#ffc107', '#ff9800', '#ff5722', '#795548'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}