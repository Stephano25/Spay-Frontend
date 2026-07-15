// frontend/src/app/components/friends/friends.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  searchBy: 'name' | 'email' | 'phone' = 'name';
  searchQuery = '';
  nameSearch = '';
  emailSearch = '';
  phoneNumber = '';
  isLoading = true;
  isSearching = false;
  isSearchingByPhone = false;
  currentUserId = '';

  private friendSubscriptions: Subscription[] = [];
  private html5QrCode: Html5Qrcode | null = null;
  private isScanning = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private friendService: FriendService,
    private router: Router,
    protected override cdr: ChangeDetectorRef
  ) {
    super();
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAllData();
  }

  override ngOnDestroy(): void {
    this.stopQRScan();
    this.friendSubscriptions.forEach(sub => sub.unsubscribe());
    super.ngOnDestroy();
  }

  get onlineFriends(): Friend[] {
    return this.friends.filter(f => f.friend?.isOnline === true);
  }

  // === Chargement des données ===
  loadAllData(): void {
    this.isLoading = true;
    this.loadFriends();
    this.loadRequests();
    this.loadSuggestions();
    this.loadBlocked();
  }

  loadFriends(): void {
    const sub = this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        const accepted = friends.filter((f: Friend) => f.status === 'accepted');
        const unique = accepted.filter(
          (f: Friend, i: number, self: Friend[]) =>
            i === self.findIndex((t: Friend) => t.friend?.id === f.friend?.id)
        );
        this.friends = unique;
        console.log('📋 Amis:', this.friends.length);
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement amis:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  loadRequests(): void {
    console.log('📩 Chargement des demandes d\'amis...');
    const sub = this.friendService.getFriendRequests().subscribe({
      next: (requests: FriendRequest[]) => {
        // Filtrer pour ne garder que les demandes en attente
        this.friendRequests = requests.filter(r => r.status === 'pending' || r.status === 'PENDING');
        console.log('📩 Demandes reçues:', this.friendRequests.length);
        console.log('📩 Détail des demandes:', JSON.stringify(this.friendRequests, null, 2));
        
        this.friendRequests.forEach((req, index) => {
          console.log(`📩 Demande ${index + 1}:`, {
            id: req.id,
            senderId: req.senderId,
            receiverId: req.receiverId,
            status: req.status,
            createdAt: req.createdAt,
            sender: req.sender ? {
              id: req.sender.id,
              name: `${req.sender.firstName} ${req.sender.lastName}`,
              email: req.sender.email
            } : '❌ Sender manquant'
          });
        });
        
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement demandes:', err);
        this.friendRequests = [];
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  loadSuggestions(): void {
    const sub = this.friendService.getSuggestions().subscribe({
      next: (suggestions: SearchUser[]) => {
        this.suggestions = suggestions;
        console.log('💡 Suggestions:', this.suggestions.length);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement suggestions:', err);
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  loadBlocked(): void {
    const sub = this.friendService.getBlockedUsers().subscribe({
      next: (blocked: Friend[]) => {
        this.blockedUsers = blocked;
        console.log('🚫 Bloqués:', this.blockedUsers.length);
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erreur chargement bloqués:', err)
    });
    this.friendSubscriptions.push(sub);
  }

  // === Méthodes de recherche ===
  clearSearch(): void {
    this.nameSearch = '';
    this.emailSearch = '';
    this.phoneNumber = '';
    this.searchQuery = '';
    this.searchResults = [];
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSearch(): void {
    if (this.searchBy === 'name') {
      this.searchByName();
    } else if (this.searchBy === 'email') {
      this.searchByEmail();
    } else if (this.searchBy === 'phone') {
      this.searchByPhone();
    }
  }

  searchByName(): void {
    const q = this.nameSearch.trim();
    if (!q || q.length < 2) {
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    const sub = this.friendService.searchUsers(q).subscribe({
      next: (results: SearchUser[]) => {
        this.searchResults = results;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur recherche:', err);
        this.isSearching = false;
        this.searchResults = [];
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  searchByEmail(): void {
    const email = this.emailSearch.trim();
    if (!email || !this.isValidEmail(email)) {
      this.notificationService.showWarning('Veuillez entrer une adresse email valide');
      return;
    }
    this.isSearching = true;
    const sub = this.friendService.searchUsers(email).subscribe({
      next: (results: SearchUser[]) => {
        this.searchResults = results.filter(u => 
          u.email?.toLowerCase() === email.toLowerCase()
        );
        this.isSearching = false;
        if (this.searchResults.length === 0) {
          this.notificationService.showInfo('Aucun utilisateur trouvé avec cet email');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur recherche par email:', err);
        this.isSearching = false;
        this.searchResults = [];
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  searchByPhone(): void {
    const phone = this.phoneNumber.trim();
    if (!phone || phone.length < 8) {
      this.notificationService.showWarning('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    this.isSearchingByPhone = true;
    const sub = this.friendService.findUsersByPhones([phone]).subscribe({
      next: (results: SearchUser[]) => {
        this.searchResults = results;
        this.isSearchingByPhone = false;
        if (results.length === 0) {
          this.notificationService.showInfo('Aucun utilisateur trouvé avec ce numéro');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur recherche par téléphone:', err);
        this.isSearchingByPhone = false;
        this.searchResults = [];
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  // === QR Code ===
  async showMyQRCode(): Promise<void> {
    try {
      const qrData = JSON.stringify({ 
        userId: this.currentUserId, 
        type: 'add_friend',
        timestamp: Date.now()
      });
      this.qrCodeImage = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      });
      this.showQRCode = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erreur génération QR code:', error);
      this.notificationService.showError('Erreur génération QR code');
    }
  }

  scanQRCode(): void {
    if (this.isScanning) {
      this.stopQRScan();
      return;
    }

    this.showQRScanner = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      const videoElement = document.getElementById('qr-video');
      if (!videoElement) {
        console.error('Élément vidéo non trouvé');
        this.notificationService.showError('Erreur d\'initialisation du scanner');
        this.stopQRScan();
        return;
      }

      try {
        this.html5QrCode = new Html5Qrcode('qr-video');
        this.isScanning = true;

        this.html5QrCode.start(
          { facingMode: 'environment' },
          { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText: string) => {
            console.log('✅ QR Code scanné:', decodedText);
            this.stopQRScan();
            this.processScannedQR(decodedText);
          },
          (errorMessage: string) => {
            if (errorMessage.includes('No QR code found')) {
              return;
            }
            console.warn('Erreur de scan:', errorMessage);
          }
        ).catch((err: any) => {
          console.error('Erreur démarrage caméra:', err);
          this.notificationService.showError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
          this.stopQRScan();
        });
      } catch (error) {
        console.error('Erreur initialisation scanner:', error);
        this.notificationService.showError('Erreur d\'initialisation du scanner');
        this.stopQRScan();
      }
    }, 100);
  }

  stopQRScan(): void {
    this.showQRScanner = false;
    if (this.html5QrCode && this.isScanning) {
      this.html5QrCode.stop()
        .then(() => {
          console.log('📷 Scanner arrêté');
        })
        .catch((err) => {
          console.warn('Erreur arrêt scanner:', err);
        })
        .finally(() => {
          this.html5QrCode = null;
          this.isScanning = false;
          this.cdr.detectChanges();
        });
    } else {
      this.isScanning = false;
      this.cdr.detectChanges();
    }
  }

  private processScannedQR(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.userId && parsed.type === 'add_friend') {
        this.sendFriendRequest(parsed.userId);
      } else {
        this.notificationService.showError('QR code invalide');
      }
    } catch (error) {
      if (data && data.length > 5) {
        this.sendFriendRequest(data);
      } else {
        this.notificationService.showError('QR code invalide');
      }
    }
  }

  // === Actions ===
  toggleFriendsList(): void { 
    this.showFriendsList = !this.showFriendsList; 
  }
  
  toggleRequestsList(): void { 
    this.showRequestsList = !this.showRequestsList; 
  }
  
  goBack(): void { 
    this.router.navigate(['/user']); 
  }

  sendFriendRequest(userId: string): void {
    if (!userId || userId === this.currentUserId) {
      this.notificationService.showWarning('Vous ne pouvez pas vous ajouter vous-même');
      return;
    }

    const existingFriend = this.friends.find(f => f.friend?.id === userId);
    if (existingFriend) {
      this.notificationService.showWarning('Cet utilisateur est déjà dans vos amis');
      return;
    }

    const existingRequest = this.friendRequests.find(r => r.sender?.id === userId);
    if (existingRequest) {
      this.notificationService.showWarning('Une demande est déjà en attente');
      return;
    }

    const sub = this.friendService.sendFriendRequest(userId).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Demande d\'ami envoyée avec succès');
        this.loadAllData();
        this.showAddFriend = false;
        this.clearSearch();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur envoi demande:', err);
        const errorMsg = err.error?.message || err.message || 'Erreur lors de l\'envoi de la demande';
        this.notificationService.showError(errorMsg);
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  acceptRequest(requestId: string): void {
    if (!requestId) {
      console.error('❌ ID de demande manquant');
      return;
    }
    
    console.log(`✅ Acceptation de la demande: ${requestId}`);
    const sub = this.friendService.acceptFriendRequest(requestId).subscribe({
      next: (response) => {
        console.log('✅ Demande acceptée avec succès:', response);
        this.notificationService.showSuccess('Demande acceptée');
        this.loadAllData();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur acceptation:', err);
        this.notificationService.showError(err.error?.message || 'Erreur lors de l\'acceptation');
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  declineRequest(requestId: string): void {
    if (!requestId) {
      console.error('❌ ID de demande manquant');
      return;
    }
    
    console.log(`❌ Refus de la demande: ${requestId}`);
    const sub = this.friendService.declineFriendRequest(requestId).subscribe({
      next: (response) => {
        console.log('✅ Demande refusée avec succès:', response);
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.notificationService.showInfo('Demande refusée');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur refus:', err);
        this.notificationService.showError(err.error?.message || 'Erreur lors du refus');
        this.cdr.detectChanges();
      }
    });
    this.friendSubscriptions.push(sub);
  }

  removeFriend(friendId: string): void {
    if (!friendId) return;
    
    if (confirm('Supprimer cet ami de votre liste ?')) {
      const sub = this.friendService.removeFriend(friendId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Ami supprimé');
          this.loadAllData();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Erreur suppression:', err);
          this.notificationService.showError(err.error?.message || 'Erreur lors de la suppression');
          this.cdr.detectChanges();
        }
      });
      this.friendSubscriptions.push(sub);
    }
  }

  blockUser(userId: string, userName: string): void {
    if (!userId) return;
    
    if (confirm(`Bloquer ${userName} ?`)) {
      const sub = this.friendService.blockUser(userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Utilisateur bloqué');
          this.loadAllData();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Erreur blocage:', err);
          this.notificationService.showError(err.error?.message || 'Erreur lors du blocage');
          this.cdr.detectChanges();
        }
      });
      this.friendSubscriptions.push(sub);
    }
  }

  unblockUser(userId: string, userName: string): void {
    if (!userId) return;
    
    if (confirm(`Débloquer ${userName} ?`)) {
      const sub = this.friendService.unblockUser(userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Utilisateur débloqué');
          this.loadAllData();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Erreur déblocage:', err);
          this.notificationService.showError(err.error?.message || 'Erreur lors du déblocage');
          this.cdr.detectChanges();
        }
      });
      this.friendSubscriptions.push(sub);
    }
  }

  // === Navigation ===
  chatWithFriend(friendId: string): void {
    if (!friendId) return;
    this.router.navigate(['/chat'], { queryParams: { friendId } });
  }

  sendMoneyToFriend(friendId: string, friendName: string): void {
    if (!friendId) return;
    this.router.navigate(['/transactions/send'], { queryParams: { friendId, friendName } });
  }

  viewFriendProfile(friendId: string): void {
    if (!friendId) return;
    this.router.navigate(['/profile', friendId]);
  }

  // === Helpers ===
  getInitials(first?: string, last?: string): string {
    const f = first?.charAt(0) || '';
    const l = last?.charAt(0) || '';
    return (f + l).toUpperCase() || '?';
  }

  formatLastSeen(date?: Date): string {
    if (!date) return 'Jamais';
    try {
      const now = new Date();
      const last = new Date(date);
      const diff = Math.floor((now.getTime() - last.getTime()) / 60000);
      if (diff < 1) return 'À l\'instant';
      if (diff < 60) return `Il y a ${diff} min`;
      if (diff < 1440) return `Il y a ${Math.floor(diff / 60)} h`;
      if (diff < 10080) return `Il y a ${Math.floor(diff / 1440)} j`;
      return last.toLocaleDateString('fr-MG');
    } catch (error) {
      return 'Inconnu';
    }
  }

  getAvatarColor(name: string): string {
    const colors = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50','#ffc107','#ff5722'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}