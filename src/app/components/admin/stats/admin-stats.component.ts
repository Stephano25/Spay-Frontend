// frontend/src/app/components/admin/stats/admin-stats.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminDataService, DashboardStats } from '../../../services/admin-data.service';
import Chart from 'chart.js/auto';
import { TranslatePipe } from '../../../pipes/translate.pipe';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule, // ✅ AJOUT
    TranslatePipe
  ],
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.css']
})
export class AdminStatsComponent extends BaseComponent implements OnInit {
  stats: DashboardStats | null = null;
  isLoading = true;
  private chart: Chart | null = null;

  constructor(private adminDataService: AdminDataService, private router: Router) { 
    super(); 
  }

  override ngOnInit(): void {
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

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}