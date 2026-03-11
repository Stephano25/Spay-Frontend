import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';

// Models
import { User } from '../../models/user.model';
import { DashboardStats, Transaction } from '../../models/transaction.model';

// Components
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { NavigationHeaderComponent } from '../shared/navigation-header/navigation-header.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    NavigationHeaderComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  stats: DashboardStats | null = null;
  recentTransactions: Transaction[] = [];
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
      this.authService.currentUser.subscribe((user: User | null) => {
        this.user = user;
      })
    );
  }

  private loadDashboardStats(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.transactionService.getUserDashboardStats().subscribe({
        next: (data: DashboardStats) => {
          this.stats = data;
          this.recentTransactions = data.lastThreeTransactions || [];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement stats:', error);
          this.isLoading = false;
        }
      })
    );
  }

  navigateToScan(): void {
    this.router.navigate(['/scan-pay']);
  }

  navigateToSend(): void {
    this.router.navigate(['/wallet/send']);
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
    this.router.navigate(['/wallet/history']);
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
}