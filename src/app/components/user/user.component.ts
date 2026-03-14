import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { WalletService } from '../../services/wallet.service';

// Models
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/transaction.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  balance: number = 0;
  stats: DashboardStats | null = null;
  isLoading = true;
  
  // Propriétés pour le template
  menuItems = [
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/wallet' },
    { icon: 'chat', label: 'Messages', route: '/chat' },
    { icon: 'swap_horiz', label: 'Transactions', route: '/transactions' },
    { icon: 'person', label: 'Profil', route: '/profile' },
    { icon: 'qr_code_scanner', label: 'Scanner', route: '/scan-pay' },
    { icon: 'phone_android', label: 'Mobile Money', route: '/mobile-money' },
    { icon: 'people', label: 'Amis', route: '/friends' },
    { icon: 'settings', label: 'Paramètres', route: '/user/settings' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadWalletData();
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.user = user;
      })
    );
  }

  private loadWalletData(): void {
    this.subscriptions.push(
      this.walletService.getWallet().subscribe({
        next: (wallet: any) => {
          this.balance = wallet.balance || 0;
          console.log('💰 Solde du wallet chargé:', this.balance);
        },
        error: (error: any) => {
          console.error('❌ Erreur chargement wallet:', error);
          // Fallback sur le user balance si wallet échoue
          if (this.user?.balance) {
            this.balance = this.user.balance;
          }
        }
      })
    );
  }

  private loadDashboardStats(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.transactionService.getUserDashboardStats().subscribe({
        next: (data: DashboardStats) => {
          this.stats = data;
          console.log('📊 Stats chargées:', data);
          
          // Si le wallet est à 0 mais les stats indiquent un solde, mettre à jour
          if (this.balance === 0 && data.totalBalance > 0) {
            this.balance = data.totalBalance;
            console.log('⚠️ Solde mis à jour depuis les transactions:', this.balance);
          }
          
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Erreur chargement stats:', error);
          this.isLoading = false;
        }
      })
    );
  }

  // Méthode de navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Méthode de déconnexion
  logout(): void {
    this.authService.logout();
  }

  // Méthode de formatage du montant
  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Méthode de rafraîchissement
  refreshData(): void {
    this.isLoading = true;
    this.loadWalletData();
    this.loadDashboardStats();
  }
}