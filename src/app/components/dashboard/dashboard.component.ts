import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import Chart from 'chart.js/auto';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';

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
    MatListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any;
  stats: any = {
    totalBalance: 150000,
    totalTransactions: 25,
    lastDeposit: { amount: 50000 },
    largestTransaction: { amount: 75000 },
    lastThreeTransactions: [
      { type: 'sent', description: 'Paiement', amount: 5000, createdAt: new Date() },
      { type: 'received', description: 'Virement', amount: 10000, createdAt: new Date() },
      { type: 'sent', description: 'Achat', amount: 3000, createdAt: new Date() }
    ],
    monthlyStats: [
      { month: '1/2026', sent: 50000, received: 30000, total: 80000 }
    ]
  };
  recentTransactions: any[] = [];
  chart: any;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.user = user || { id: '1', firstName: 'Jean', lastName: 'Rakoto' };
    });
  }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.recentTransactions = this.stats.lastThreeTransactions;
    this.createChart(this.stats.monthlyStats);
  }

  createChart(monthlyStats: any[]): void {
    setTimeout(() => {
      const ctx = document.getElementById('transactionsChart') as HTMLCanvasElement;
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: monthlyStats.map((s) => s.month),
            datasets: [
              {
                label: 'Envoyé',
                data: monthlyStats.map((s) => s.sent),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
              },
              {
                label: 'Reçu',
                data: monthlyStats.map((s) => s.received),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Statistiques mensuelles',
              },
            },
          },
        });
      }
    }, 100);
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

  logout(): void {
    this.authService.logout();
  }
}