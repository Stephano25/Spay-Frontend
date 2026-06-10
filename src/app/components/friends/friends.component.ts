import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';

import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { FriendService } from '../../services/friend.service';
import { Friend, FriendRequest, SearchUser } from '../../models/friend.model';

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
    CommonModule, FormsModule, RouterModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatListModule, MatTabsModule,
    MatMenuModule, MatDividerModule, MatProgressSpinnerModule,
    MatBadgeModule, MatChipsModule
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit, OnDestroy {
  friends: Friend[] = [];
  friendRequests: FriendRequest[] = [];
  searchResults: SearchUser[] = [];
  suggestions: SearchUser[] = [];
  blockedUsers: Friend[] = [];

  showFriendsList = true;
  showRequestsList = true;
  showAddFriend = false;
  showBlockedUsers = false;
  showQRCode = false;
  qrCodeImage = '';

  searchQuery = '';
  isLoading = true;
  isSearching = false;
  currentUserId = '';

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
    this.loadAllData();
    // Pas de synchronisation des contacts dans Angular (gérée par React Native)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get onlineFriends(): Friend[] {
    return this.friends.filter(f => f.friend?.isOnline === true);
  }

  loadAllData(): void {
    this.isLoading = true;
    this.loadFriends();
    this.loadRequests();
    this.loadSuggestions();
    this.loadBlocked();
  }

  loadFriends(): void {
    this.friendService.getFriends().subscribe({
      next: (friends) => {
        const accepted = friends.filter(f => f.status === 'accepted');
        const unique = accepted.filter((f, i, self) =>
          i === self.findIndex(t => t.friend?.id === f.friend?.id)
        );
        this.friends = unique;
        console.log('📋 Amis:', this.friends);
      },
      error: (err) => console.error(err)
    });
  }

  loadRequests(): void {
    this.friendService.getFriendRequests().subscribe({
      next: (requests) => {
        this.friendRequests = requests;
        console.log('📩 Demandes:', this.friendRequests);
      },
      error: (err) => console.error(err)
    });
  }

  loadSuggestions(): void {
    this.friendService.getSuggestions().subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
        console.log('💡 Suggestions:', this.suggestions);
        this.isLoading = false;
      },
      error: (err) => console.error(err)
    });
  }

  loadBlocked(): void {
    this.friendService.getBlockedUsers().subscribe({
      next: (blocked) => {
        this.blockedUsers = blocked;
        console.log('🚫 Bloqués:', this.blockedUsers);
      },
      error: (err) => console.error(err)
    });
  }

  // Afficher son propre QR code
  async showMyQRCode(): Promise<void> {
    try {
      const qrData = JSON.stringify({ userId: this.currentUserId, type: 'add_friend' });
      this.qrCodeImage = await QRCode.toDataURL(qrData);
      this.showQRCode = true;
    } catch (err) {
      this.notificationService.showError('Erreur génération QR code');
    }
  }

  // Scanner un QR code (ajout d'ami)
  scanQRCode(): void {
    // Version web : utiliser une entrée texte
    const qrText = prompt('Collez le contenu du QR code :');
    if (qrText) this.processScannedQR(qrText);
  }

  private processScannedQR(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.userId && parsed.type === 'add_friend') {
        this.sendFriendRequest(parsed.userId);
      } else {
        this.notificationService.showError('QR code invalide');
      }
    } catch {
      this.sendFriendRequest(data);
    }
  }

  toggleFriendsList(): void { this.showFriendsList = !this.showFriendsList; }
  toggleRequestsList(): void { this.showRequestsList = !this.showRequestsList; }
  goBack(): void { this.router.navigate(['/user']); }

  onSearch(): void {
    if (!this.searchQuery.trim() || this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    this.friendService.searchUsers(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: (err) => {
        console.error(err);
        this.isSearching = false;
      }
    });
  }

  sendFriendRequest(userId: string): void {
    if (userId === this.currentUserId) {
      this.notificationService.showWarning('Vous ne pouvez pas vous ajouter vous-même');
      return;
    }
    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error(err)
    });
  }

  acceptRequest(requestId: string): void {
    this.friendService.acceptFriendRequest(requestId).subscribe({
      next: () => this.loadAllData()
    });
  }

  declineRequest(requestId: string): void {
    this.friendService.declineFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
      }
    });
  }

  removeFriend(friendId: string): void {
    if (confirm('Supprimer cet ami ?')) {
      this.friendService.removeFriend(friendId).subscribe({
        next: () => this.loadAllData()
      });
    }
  }

  blockUser(userId: string, userName: string): void {
    if (confirm(`Bloquer ${userName} ?`)) {
      this.friendService.blockUser(userId).subscribe({
        next: () => this.loadAllData()
      });
    }
  }

  unblockUser(userId: string, userName: string): void {
    if (confirm(`Débloquer ${userName} ?`)) {
      this.friendService.unblockUser(userId).subscribe({
        next: () => this.loadAllData()
      });
    }
  }

  chatWithFriend(friendId: string): void {
    this.router.navigate(['/chat'], { queryParams: { friendId } });
  }

  sendMoneyToFriend(friendId: string, friendName: string): void {
    this.router.navigate(['/transactions/send'], { queryParams: { friendId, friendName } });
  }

  viewFriendProfile(friendId: string): void {
    this.router.navigate(['/profile', friendId]);
  }

  getInitials(first?: string, last?: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  formatLastSeen(date?: Date): string {
    if (!date) return 'Jamais';
    const now = new Date();
    const last = new Date(date);
    const diff = Math.floor((now.getTime() - last.getTime()) / 60000);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)} h`;
    return last.toLocaleDateString('fr-MG');
  }

  getAvatarColor(name: string): string {
    const colors = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50','#ffc107','#ff5722'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}