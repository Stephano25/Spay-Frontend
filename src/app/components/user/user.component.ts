// frontend/src/app/components/user/user.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list'; // ✅ Ajout de MatGridListModule

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
    MatGridListModule, // ✅ Ajout dans les imports
    TranslatePipe,
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  balance: number = 0;
  isLoading: boolean = true;
  stats: any = null;
  profileImageUrl: string | null = null;

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

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    console.log('🏠 UserComponent chargé');
  }

  ngOnInit(): void {
    console.log('🔄 Initialisation UserComponent');
    this.loadUserData();
    this.loadBalance();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        console.log('👤 Utilisateur reçu:', user?.email);
        this.user = user;
        if (user) {
          this.profileImageUrl = user.profilePicture || null;
        }
        this.isLoading = false;
        
        if (user && (user.role === 'admin' || user.role === 'super_admin')) {
          console.log('🔀 Admin détecté, redirection vers /admin/dashboard');
          this.router.navigate(['/admin/dashboard']);
        }
      })
    );
  }

  private loadBalance(): void {
    this.subscriptions.push(
      this.walletService.getBalance().subscribe({
        next: (data) => {
          this.balance = data.balance || 0;
          console.log('💰 Solde chargé:', this.balance);
        },
        error: (err) => {
          console.error('❌ Erreur chargement solde:', err);
          this.balance = 0;
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
        },
        error: (err) => {
          console.error('❌ Erreur chargement stats:', err);
          this.stats = { totalTransactions: 0, lastThreeTransactions: [] };
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
    this.notificationService.showInfo('Données actualisées');
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  openDepositScanner(): void {
    this.router.navigate(['/user/scan-pay'], { 
      queryParams: { type: 'deposit' } 
    });
  }

  openWithdrawScanner(): void {
    this.router.navigate(['/user/scan-pay'], { 
      queryParams: { type: 'withdraw' } 
    });
  }
}