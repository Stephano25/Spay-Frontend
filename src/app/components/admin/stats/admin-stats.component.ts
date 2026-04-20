import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService, DashboardStats } from '../../../services/admin-data.service';
import Chart from 'chart.js/auto';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="stats-container">
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="60"></mat-spinner>
        <p>Chargement des statistiques...</p>
      </div>

      <div *ngIf="!isLoading && stats" class="stats-content">
        <!-- Cartes KPIs -->
        <div class="kpi-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon users">
                <mat-icon>people</mat-icon>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ formatNumber(stats.totalUsers) }}</div>
                <div class="kpi-label">Utilisateurs</div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon active">
                <mat-icon>online_prediction</mat-icon>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ formatNumber(stats.activeUsers) }}</div>
                <div class="kpi-label">Utilisateurs actifs</div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon transactions">
                <mat-icon>swap_horiz</mat-icon>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ formatNumber(stats.totalTransactions) }}</div>
                <div class="kpi-label">Transactions</div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon volume">
                <mat-icon>account_balance_wallet</mat-icon>
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ formatAmount(stats.totalVolume) }} Ar</div>
                <div class="kpi-label">Volume total</div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Graphique d'activité -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Activité récente</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas id="activityChart"></canvas>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .kpi-card {
      border-radius: 16px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-4px);
    }
    .kpi-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .kpi-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-icon.users { background: #e3f2fd; color: #1976d2; }
    .kpi-icon.active { background: #e8f5e9; color: #4caf50; }
    .kpi-icon.transactions { background: #fff3e0; color: #ff9800; }
    .kpi-icon.volume { background: #f3e5f5; color: #9c27b0; }
    .kpi-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .kpi-info { flex: 1; }
    .kpi-value { font-size: 28px; font-weight: bold; color: #333; }
    .kpi-label { font-size: 14px; color: #666; margin-top: 4px; }
    .chart-card { border-radius: 16px; margin-top: 20px; }
    .chart-card canvas { max-height: 400px; width: 100%; }
  `]
})
export class AdminStatsComponent implements OnInit {
  stats: DashboardStats | null = null;
  isLoading = true;
  private chart: Chart | null = null;

  constructor(private adminDataService: AdminDataService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.adminDataService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
        setTimeout(() => this.createChart(), 200);
      },
      error: (error) => {
        console.error('Erreur chargement stats:', error);
        this.isLoading = false;
      }
    });
  }

  createChart(): void {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (ctx && this.stats?.recentTransactions) {
      if (this.chart) this.chart.destroy();
      
      const last7Days = this.getLast7Days();
      const transactionsPerDay = last7Days.map(day => {
        return this.stats!.recentTransactions.filter(t => 
          new Date(t.createdAt).toDateString() === day.toDateString()
        ).length;
      });

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days.map(d => d.toLocaleDateString('fr-MG', { day: '2-digit', month: '2-digit' })),
          datasets: [{
            label: 'Transactions',
            data: transactionsPerDay,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    }
  }

  private getLast7Days(): Date[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-MG').format(num);
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + ' k';
    }
    return amount.toString();
  }
}