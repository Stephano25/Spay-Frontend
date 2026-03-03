import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

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
  
  // UI
  showAddFriend = false;
  searchQuery = '';
  isLoading = false;
  isSearching = false;
  selectedTabIndex = 0;
  
  // Utilisateur courant
  currentUserId: string = '';
  
  private subscriptions: Subscription[] = [];
  private onlineStatusInterval: any;

  // Données simulées
  private mockFriends: Friend[] = [
    {
      id: 'f1',
      userId: 'current_user',
      friendId: 'u2',
      status: 'accepted',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      friend: {
        id: 'u2',
        firstName: 'Marie',
        lastName: 'Rabe',
        email: 'marie.rabe@email.com',
        phoneNumber: '0347654321',
        isOnline: true,
        lastSeen: new Date()
      }
    },
    {
      id: 'f2',
      userId: 'current_user',
      friendId: 'u3',
      status: 'accepted',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      friend: {
        id: 'u3',
        firstName: 'Pierre',
        lastName: 'Randria',
        email: 'pierre.randria@email.com',
        phoneNumber: '0334567890',
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000)
      }
    },
    {
      id: 'f3',
      userId: 'current_user',
      friendId: 'u4',
      status: 'accepted',
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
      friend: {
        id: 'u4',
        firstName: 'Lovasoa',
        lastName: 'Rakotondrabe',
        email: 'lovasoa@email.com',
        phoneNumber: '0381234567',
        isOnline: true,
        lastSeen: new Date()
      }
    }
  ];

  private mockRequests: FriendRequest[] = [
    {
      id: 'r1',
      senderId: 'u5',
      receiverId: 'current_user',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000),
      sender: {
        id: 'u5',
        firstName: 'Soa',
        lastName: 'Andrianantenaina',
        email: 'soa@email.com',
        profilePicture: undefined
      }
    },
    {
      id: 'r2',
      senderId: 'u6',
      receiverId: 'current_user',
      status: 'pending',
      createdAt: new Date(Date.now() - 172800000),
      sender: {
        id: 'u6',
        firstName: 'Hery',
        lastName: 'Rajaonah',
        email: 'hery@email.com',
        profilePicture: undefined
      }
    }
  ];

  private mockSuggestions: SearchUser[] = [
    {
      id: 'u7',
      firstName: 'Mialy',
      lastName: 'Randria',
      email: 'mialy@email.com',
      phoneNumber: '0341122334',
      isFriend: false,
      hasPendingRequest: false
    },
    {
      id: 'u8',
      firstName: 'Faly',
      lastName: 'Rakotoarisoa',
      email: 'faly@email.com',
      phoneNumber: '0334455667',
      isFriend: false,
      hasPendingRequest: false
    },
    {
      id: 'u9',
      firstName: 'Tahina',
      lastName: 'Razafimahatratra',
      email: 'tahina@email.com',
      phoneNumber: '0387788990',
      isFriend: false,
      hasPendingRequest: false
    }
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || 'current_user';
  }

  ngOnInit(): void {
    this.loadFriends();
    this.loadFriendRequests();
    this.loadSuggestions();
    this.startOnlineStatusTracking();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.onlineStatusInterval) {
      clearInterval(this.onlineStatusInterval);
    }
  }

  /**
   * Charger la liste des amis (données simulées)
   */
  private loadFriends(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.friends = this.mockFriends;
      this.isLoading = false;
    }, 800);
  }

  /**
   * Charger les demandes d'amis (données simulées)
   */
  private loadFriendRequests(): void {
    setTimeout(() => {
      this.friendRequests = this.mockRequests;
    }, 600);
  }

  /**
   * Charger les suggestions d'amis (données simulées)
   */
  private loadSuggestions(): void {
    setTimeout(() => {
      this.suggestions = this.mockSuggestions;
    }, 400);
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
    
    // Simulation de recherche
    setTimeout(() => {
      const mockResults: SearchUser[] = [
        {
          id: 'u10',
          firstName: 'Rado',
          lastName: 'Rakotomalala',
          email: 'rado@email.com',
          phoneNumber: '0345566778',
          isFriend: false,
          hasPendingRequest: false
        },
        {
          id: 'u11',
          firstName: 'Lalao',
          lastName: 'Rasoa',
          email: 'lalao@email.com',
          phoneNumber: '0338899001',
          isFriend: false,
          hasPendingRequest: true
        }
      ].filter(u => 
        u.firstName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.includes(this.searchQuery)
      );
      
      this.searchResults = mockResults;
      this.isSearching = false;
    }, 500);
  }

  /**
   * Envoyer une demande d'ami
   */
  sendFriendRequest(userId: string): void {
    const user = this.searchResults.find(u => u.id === userId) || this.suggestions.find(u => u.id === userId);
    if (user) {
      user.hasPendingRequest = true;
      this.notificationService.showSuccess(`Demande d'ami envoyée à ${user.firstName}`);
      
      // Ajouter une nouvelle demande dans les notifications
      const newRequest: FriendRequest = {
        id: 'r' + Date.now(),
        senderId: userId,
        receiverId: this.currentUserId,
        status: 'pending',
        createdAt: new Date(),
        sender: {
          id: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      };
      this.friendRequests.unshift(newRequest);
    }
  }

  /**
   * Accepter une demande d'ami
   */
  acceptRequest(requestId: string): void {
    const request = this.friendRequests.find(r => r.id === requestId);
    if (request) {
      // Retirer la demande de la liste
      this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
      
      // Ajouter aux amis
      const newFriend: Friend = {
        id: 'f' + Date.now(),
        userId: this.currentUserId,
        friendId: request.senderId,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date(),
        friend: {
          id: request.senderId,
          firstName: request.sender?.firstName || '',
          lastName: request.sender?.lastName || '',
          email: request.sender?.email || '',
          phoneNumber: '0340000000',
          isOnline: false
        }
      };
      this.friends.unshift(newFriend);
      
      this.notificationService.showSuccess('Demande d\'ami acceptée');
    }
  }

  /**
   * Refuser une demande d'ami
   */
  declineRequest(requestId: string): void {
    this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
    this.notificationService.showInfo('Demande d\'ami refusée');
  }

  /**
   * Supprimer un ami
   */
  removeFriend(friendId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cet ami ?')) {
      this.friends = this.friends.filter(f => f.id !== friendId);
      this.notificationService.showSuccess('Ami supprimé');
    }
  }

  /**
   * Démarrer le suivi des statuts en ligne
   */
  private startOnlineStatusTracking(): void {
    // Simulation de mise à jour des statuts
    this.onlineStatusInterval = setInterval(() => {
      this.friends = this.friends.map(f => ({
        ...f,
        friend: f.friend ? {
          ...f.friend,
          isOnline: Math.random() > 0.5
        } : undefined
      }));
    }, 30000);
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