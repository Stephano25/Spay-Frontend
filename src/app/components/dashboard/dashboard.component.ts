import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

import { AuthService } from '../../services/auth.service';
import { TransactionService, DashboardStats } from '../../services/transaction.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any;
  stats: DashboardStats | null = null;
  recentTransactions: any[] = [];
  chart: any;
  isLoading = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router
  ) {
    this.subscriptions.push(
      this.authService.currentUser.subscribe(user => {
        this.user = user;
      })
    );
  }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.transactionService.getDashboardStats().subscribe({
        next: (data) => {
          this.stats = data;
          this.recentTransactions = data.lastThreeTransactions;
          setTimeout(() => this.createChart(data.monthlyStats), 100);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stats', error);
          this.isLoading = false;
        }
      })
    );
  }

  createChart(monthlyStats: any[]): void {
    const ctx = document.getElementById('transactionsChart') as HTMLCanvasElement;
    if (ctx && monthlyStats && monthlyStats.length > 0) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthlyStats.map(s => s.month),
          datasets: [
            {
              label: 'Envoyé',
              data: monthlyStats.map(s => s.sent),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4
            },
            {
              label: 'Reçu',
              data: monthlyStats.map(s => s.received),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            title: {
              display: true,
              text: 'Statistiques mensuelles'
            }
          }
        }
      });
    }
  }

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

  navigateToStats(): void {
    this.router.navigate(['/stats']);
  }

  logout(): void {
    this.authService.logout();
  }

  getTransactionIcon(type: string): string {
    switch(type) {
      case 'transfer': return 'swap_horiz';
      case 'payment': return 'payment';
      case 'mobile_money': return 'phone_android';
      case 'deposit': return 'arrow_downward';
      case 'withdrawal': return 'arrow_upward';
      default: return 'receipt';
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  }
}