import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';

// Models
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/transaction.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  stats: DashboardStats | null = null;
  recentTransactions: any[] = [];
  isLoading = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe(user => {
        this.user = user;
      })
    );
  }

  private loadDashboardStats(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.transactionService.getUserDashboardStats().subscribe({
        next: (data) => {
          this.stats = data;
          this.recentTransactions = data.lastThreeTransactions || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement stats:', error);
          this.isLoading = false;
        }
      })
    );
  }

  // Méthodes de navigation
  navigateToScan(): void {
    this.router.navigate(['/scan-pay']);
  }

  navigateToSend(): void {
    this.router.navigate(['/transactions/send']);
  }

  navigateToMobileMoney(): void {
    this.router.navigate(['/mobile-money']);
  }

  navigateToChat(): void {
    this.router.navigate(['/chat']);
  }

  navigateToFriends(): void {
    this.router.navigate(['/friends']);
  }

  navigateToTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  navigateToStats(): void {
    this.router.navigate(['/stats']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      'transfer': 'swap_horiz',
      'payment': 'payment',
      'mobile_money': 'phone_android',
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward'
    };
    return icons[type] || 'receipt';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }
}