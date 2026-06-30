// ============================================================
// USER COMPONENT - SPaye (Version Corrigée)
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { WalletService } from '../../services/wallet.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';
import { User } from '../../models/user.model';

// ✅ Import du pipe standalone
import { TranslatePipe } from '../../pipes/translate.pipe';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

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
  
  // ✅ Rendre public pour l'utiliser dans le template
  profileImageUrl: string | null = null;

  menuItems = [
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/wallet' },
    { icon: 'send', label: 'Envoyer', route: '/wallet/send' },
    { icon: 'qr_code', label: 'Recevoir', route: '/wallet/receive' },
    { icon: 'phone_android', label: 'Mobile Money', route: '/mobile-money' },
    { icon: 'qr_code_scanner', label: 'Scanner', route: '/scan-pay' },
    { icon: 'people', label: 'Amis', route: '/friends' },
    { icon: 'chat', label: 'Messages', route: '/chat' },
    { icon: 'receipt', label: 'Transactions', route: '/transactions' },
    { icon: 'person', label: 'Profil', route: '/profile' },
    { icon: 'settings', label: 'Paramètres', route: '/settings' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private walletService: WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
        this.user = user;
        if (user) {
          this.profileImageUrl = user.profilePicture || null;
        }
        this.isLoading = false;
      })
    );
  }

  private loadBalance(): void {
    this.subscriptions.push(
      this.walletService.getBalance().subscribe({
        next: (data) => {
          this.balance = data.balance;
        },
        error: (err) => {
          console.error('Erreur chargement solde:', err);
          this.walletService.getWallet().subscribe({
            next: (wallet) => {
              this.balance = wallet.balance;
            },
            error: () => {}
          });
        }
      })
    );
  }

  private loadStats(): void {
    this.subscriptions.push(
      this.transactionService.getUserDashboardStats().subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (err) => {
          console.error('Erreur chargement stats:', err);
          this.stats = { totalTransactions: 0, lastThreeTransactions: [] };
        }
      })
    );
  }

  navigateTo(route: string): void {
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
}