// frontend/src/app/components/user/user.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { TranslationService } from '../../services/translation.service';
import { User } from '../../models/user.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { environment } from '../../../environments/environment';
import { BaseComponent } from '../base.component';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatGridListModule,
    TranslatePipe,
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent extends BaseComponent implements OnInit, OnDestroy {
  user: User | null = null;
  balance: number = 0;
  isLoading: boolean = true;
  stats: any = null;
  profileImageUrl: string | null = null;
  imageError: boolean = false;
  currentLanguage: string = 'fr';

  private avatarColors = [
    '#7c3aed', '#6d28d9', '#4f46e5', '#0891b2', 
    '#0d9488', '#059669', '#d97706', '#dc2626', 
    '#db2777', '#9333ea'
  ];

  menuItems = [
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/user/wallet' },
    { icon: 'send', label: 'Envoyer', route: '/user/wallet/send' },
    { icon: 'qr_code', label: 'Recevoir', route: '/user/wallet/receive' },
    { icon: 'phone_android', label: 'Mobile Money', route: '/user/mobile-money' },
    { icon: 'qr_code_scanner', label: 'Scanner', route: '/user/scan-pay' },
    { icon: 'people', label: 'Amis', route: '/user/friends' },
    { icon: 'chat', label: 'Messages', route: '/user/chat' },
    { icon: 'receipt', label: 'Transactions', route: '/user/transactions' },
    { icon: 'person', label: 'Profil', route: '/user/profile' },
    { icon: 'settings', label: 'Paramètres', route: '/user/settings' }
  ];

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    super();
    console.log('🏠 UserComponent chargé');
  }

  override ngOnInit(): void {
    super.ngOnInit();
    console.log('🔄 Initialisation UserComponent');
    this.loadUserData();
    this.loadBalance();
    this.loadStats();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  private getFullImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('/uploads')) {
      const baseUrl = environment.baseUrl || environment.apiUrl || 'http://localhost:3000';
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const cleanUrl = url.replace(/^\/+/, '');
      return cleanBase + '/' + cleanUrl;
    }
    
    if (url.startsWith('/assets')) {
      return url;
    }
    
    if (!url.includes('/')) {
      const baseUrl = environment.baseUrl || environment.apiUrl || 'http://localhost:3000';
      const cleanBase = baseUrl.replace(/\/+$/, '');
      return cleanBase + '/uploads/profiles/' + url;
    }
    
    return url;
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        console.log('👤 Utilisateur reçu:', user?.email);
        console.log('📸 Photo de profil brute:', user?.profilePicture);
        
        this.user = user;
        this.imageError = false;
        
        if (user) {
          if (user.profilePicture) {
            const fullUrl = this.getFullImageUrl(user.profilePicture);
            console.log('🖼️ URL générée:', fullUrl);
            
            if (fullUrl) {
              this.profileImageUrl = fullUrl;
              this.checkImageExists(fullUrl);
            } else {
              this.imageError = true;
              this.profileImageUrl = null;
            }
          } else {
            this.profileImageUrl = null;
            console.log('🖼️ Aucune photo de profil');
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    );
  }

  private checkImageExists(url: string): void {
    if (!url || url.length < 10) {
      console.warn('⚠️ URL invalide:', url);
      this.imageError = true;
      this.profileImageUrl = null;
      this.cdr.detectChanges();
      return;
    }

    const img = new Image();
    const timeout = setTimeout(() => {
      console.warn('⏰ Timeout pour l\'image:', url);
      this.imageError = true;
      this.profileImageUrl = null;
      this.cdr.detectChanges();
    }, 8000);
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('✅ Image chargée avec succès:', url);
      this.imageError = false;
      this.cdr.detectChanges();
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('❌ Image non trouvée:', url);
      this.imageError = true;
      this.profileImageUrl = null;
      this.cdr.detectChanges();
    };
    
    img.src = url;
  }

  private loadBalance(): void {
    this.subscriptions.push(
      this.walletService.getBalance().subscribe({
        next: (data) => {
          this.balance = data.balance || 0;
          console.log('💰 Solde chargé:', this.balance);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur chargement solde:', err);
          this.balance = 0;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private loadStats(): void {
    this.subscriptions.push(
      this.transactionService.getUserDashboardStats().subscribe({
        next: (stats) => {
          this.stats = stats;
          console.log('📊 Stats chargées:', stats);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur chargement stats:', err);
          this.stats = { totalTransactions: 0, lastThreeTransactions: [] };
          this.cdr.detectChanges();
        }
      })
    );
  }

  navigateTo(route: string): void {
    console.log('🔀 Navigation vers:', route);
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }

  refreshData(): void {
    this.loadBalance();
    this.loadStats();
    this.loadUserData();
    this.notificationService.showInfo('Données actualisées');
  }

  getInitials(): string {
    if (!this.user) return '';
    const first = this.user.firstName?.charAt(0) || '';
    const last = this.user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  handleImageError(): void {
    console.warn('❌ Erreur de chargement de l\'image de profil');
    this.imageError = true;
    this.profileImageUrl = null;
    this.cdr.detectChanges();
  }

  getAvatarGradient(): string {
    if (!this.user) return 'linear-gradient(135deg, #7c3aed, #4f46e5)';
    const name = this.user.firstName + this.user.lastName;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color1 = this.avatarColors[Math.abs(hash) % this.avatarColors.length];
    const color2 = this.avatarColors[(Math.abs(hash) + 3) % this.avatarColors.length];
    return 'linear-gradient(135deg, ' + color1 + ', ' + color2 + ')';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  /**
   * Ouvre le scanner de QR Code pour un DÉPÔT
   * Le label "Dépôt" est affiché sur le bouton
   */
  openDepositScanner(): void {
    this.router.navigate(['/user/scan-pay'], { 
      queryParams: { type: 'deposit' } 
    });
  }

  /**
   * Ouvre le scanner de QR Code pour un RETRAIT
   * Le label "Retrait" est affiché sur le bouton
   */
  openWithdrawScanner(): void {
    this.router.navigate(['/user/scan-pay'], { 
      queryParams: { type: 'withdraw' } 
    });
  }
}