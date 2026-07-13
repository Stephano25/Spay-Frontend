// src/app/components/friends/friends.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { FriendService, Friend, FriendRequest, SearchUser } from '../../services/friend.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { BaseComponent } from '../base.component';

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
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatChipsModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent extends BaseComponent implements OnInit, OnDestroy {
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
  showQRScanner = false;
  qrCodeImage = '';

  searchQuery = '';
  isLoading = true;
  isSearching = false;
  currentUserId = '';

  private html5QrCode: Html5Qrcode | null = null;
  private isScanning = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private friendService: FriendService,
    private router: Router
  ) {
    // ✅ APPEL OBLIGATOIRE - DOIT ÊTRE LE PREMIER
    super();
    
    // ✅ Maintenant on peut utiliser 'this'
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
  }

  override ngOnInit(): void {
    this.loadAllData();
  }

  override ngOnDestroy(): void {
    this.stopQRScan();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    super.ngOnDestroy(); // ✅ Appeler super.ngOnDestroy()
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
      next: (friends: Friend[]) => {
        const accepted = friends.filter((f: Friend) => f.status === 'accepted');
        const unique = accepted.filter(
          (f: Friend, i: number, self: Friend[]) =>
            i === self.findIndex((t: Friend) => t.friend?.id === f.friend?.id)
        );
        this.friends = unique;
        console.log('📋 Amis:', this.friends);
      },
      error: (err: any) => console.error(err)
    });
  }

  loadRequests(): void {
    this.friendService.getFriendRequests().subscribe({
      next: (requests: FriendRequest[]) => {
        this.friendRequests = requests;
        console.log('📩 Demandes:', this.friendRequests);
      },
      error: (err: any) => console.error(err)
    });
  }

  loadSuggestions(): void {
    this.friendService.getSuggestions().subscribe({
      next: (suggestions: SearchUser[]) => {
        this.suggestions = suggestions;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadBlocked(): void {
    this.friendService.getBlockedUsers().subscribe({
      next: (blocked: Friend[]) => {
        this.blockedUsers = blocked;
        console.log('🚫 Bloqués:', this.blockedUsers);
      },
      error: (err: any) => console.error(err)
    });
  }

  // === QR Code ===
  async showMyQRCode(): Promise<void> {
    try {
      const qrData = JSON.stringify({ userId: this.currentUserId, type: 'add_friend' });
      this.qrCodeImage = await QRCode.toDataURL(qrData);
      this.showQRCode = true;
    } catch {
      this.notificationService.showError('Erreur génération QR code');
    }
  }

  scanQRCode(): void {
    this.showQRScanner = true;
    if (this.isScanning) {
      this.stopQRScan();
      return;
    }

    const scannerContainer = document.createElement('div');
    scannerContainer.id = 'qr-scanner-container';
    Object.assign(scannerContainer.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '3000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    });

    const videoContainer = document.createElement('div');
    videoContainer.id = 'qr-reader';
    Object.assign(videoContainer.style, { width: '100%', maxWidth: '400px', margin: 'auto' });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Fermer';
    Object.assign(closeBtn.style, {
      marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444',
      color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
    });
    closeBtn.onclick = () => this.stopQRScan();

    scannerContainer.appendChild(videoContainer);
    scannerContainer.appendChild(closeBtn);
    document.body.appendChild(scannerContainer);

    this.html5QrCode = new Html5Qrcode('qr-reader');
    this.isScanning = true;

    this.html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => {
        this.stopQRScan();
        this.processScannedQR(decodedText);
      },
      () => {}
    ).catch((err: any) => {
      console.error('Erreur caméra', err);
      this.notificationService.showError('Impossible d\'accéder à la caméra');
      this.stopQRScan();
    });
  }

  stopQRScan(): void {
    this.showQRScanner = false;
    if (this.html5QrCode && this.isScanning) {
      this.html5QrCode.stop().catch(console.error);
      this.html5QrCode = null;
    }
    this.isScanning = false;
    const container = document.getElementById('qr-scanner-container');
    if (container) container.remove();
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

  // === Actions ===
  toggleFriendsList(): void { this.showFriendsList = !this.showFriendsList; }
  toggleRequestsList(): void { this.showRequestsList = !this.showRequestsList; }
  goBack(): void { this.router.navigate(['/user']); }

  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q || q.length < 2) {
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    this.friendService.searchUsers(q).subscribe({
      next: (results: SearchUser[]) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: () => { this.isSearching = false; }
    });
  }

  sendFriendRequest(userId: string): void {
    if (userId === this.currentUserId) {
      this.notificationService.showWarning('Vous ne pouvez pas vous ajouter vous-même');
      return;
    }
    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Demande envoyée');
        this.loadAllData();
      },
      error: (err: any) => this.notificationService.showError(err.error?.message || 'Erreur')
    });
  }

  acceptRequest(requestId: string): void {
    this.friendService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Demande acceptée');
        this.loadAllData();
      },
      error: (err: any) => this.notificationService.showError(err.error?.message || 'Erreur')
    });
  }

  declineRequest(requestId: string): void {
    this.friendService.declineFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.notificationService.showInfo('Demande refusée');
      },
      error: (err: any) => this.notificationService.showError(err.error?.message || 'Erreur')
    });
  }

  removeFriend(friendId: string): void {
    if (confirm('Supprimer cet ami de votre liste ?')) {
      this.friendService.removeFriend(friendId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Ami supprimé');
          this.loadAllData();
        },
        error: (err: any) => this.notificationService.showError(err.error?.message || 'Erreur')
      });
    }
  }

  blockUser(userId: string, userName: string): void {
    if (confirm(`Bloquer ${userName} ?`)) {
      this.friendService.blockUser(userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Utilisateur bloqué');
          this.loadAllData();
        },
        error: (err: any) => this.notificationService.showError(err.error?.message || 'Erreur')
      });
    }
  }

  unblockUser(userId: string, userName: string): void {
    if (confirm(`Débloquer ${userName} ?`)) {
      this.friendService.unblockUser(userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Utilisateur débloqué');
          this.loadAllData();
        },
        error: (err: any) => this.notificationService.showError(err.error?.message || 'Erreur')
      });
    }
  }

  // === Navigation ===
  chatWithFriend(friendId: string): void {
    this.router.navigate(['/chat'], { queryParams: { friendId } });
  }

  sendMoneyToFriend(friendId: string, friendName: string): void {
    this.router.navigate(['/transactions/send'], { queryParams: { friendId, friendName } });
  }

  viewFriendProfile(friendId: string): void {
    this.router.navigate(['/profile', friendId]);
  }

  // === Helpers ===
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