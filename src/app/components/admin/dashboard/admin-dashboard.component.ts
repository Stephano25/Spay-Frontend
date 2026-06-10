// src/app/components/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { AdminService, AdminDashboardStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatGridListModule, MatProgressSpinnerModule, MatTooltipModule, MatButtonToggleModule, MatRippleModule, MatToolbarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  stats: AdminDashboardStats | null = null;
  isLoading = true;
  selectedPeriod: 'day' | 'week' | 'month' = 'week';
  currentDate = new Date();
  private subscriptions: Subscription[] = [];
  private charts: Chart[] = [];

  constructor(private adminService: AdminService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.charts.forEach(chart => chart.destroy());
  }

  private loadUserData(): void {
    this.subscriptions.push(this.authService.currentUser.subscribe(user => (this.user = user)));
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.adminService.getDashboardStats().subscribe({
        next: (data) => {
          this.stats = data;
          setTimeout(() => this.createCharts(), 200);
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      })
    );
  }

  private createCharts(): void {
    this.createActivityChart();
    this.createUsersChart();
    this.createRevenueChart();
  }

  private createActivityChart(): void {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (ctx && this.stats?.dailyStats) {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.stats.dailyStats.map(d => d.date),
          datasets: [
            {
              label: 'Transactions',
              data: this.stats.dailyStats.map(d => d.transactions),
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4,
              yAxisID: 'y',
              fill: true
            },
            {
              label: 'Volume (kAr)',
              data: this.stats.dailyStats.map(d => d.volume / 1000),
              borderColor: '#2196f3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              tension: 0.4,
              yAxisID: 'y1',
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  let label = ctx.dataset.label || '';
                  if (label) label += ': ';
                  if (ctx.parsed.y !== null) {
                    if (ctx.dataset.label === 'Volume (kAr)') label += ctx.parsed.y.toFixed(0) + ' kAr';
                    else label += ctx.parsed.y;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Nombre' }, grid: { color: 'rgba(0,0,0,0.05)' } },
            y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Volume (milliers Ar)' }, grid: { drawOnChartArea: false } }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  private createUsersChart(): void {
    const ctx = document.getElementById('usersChart') as HTMLCanvasElement;
    if (ctx && this.stats) {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Actifs', 'Inactifs'],
          datasets: [{ data: [this.stats.activeUsers, this.stats.totalUsers - this.stats.activeUsers], backgroundColor: ['#4caf50', '#ff9800'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const label = ctx.label || '';
                  const value = ctx.raw as number;
                  const total = this.stats?.totalUsers || 0;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  private createRevenueChart(): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (ctx && this.stats?.dailyStats) {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.stats.dailyStats.map(d => d.date),
          datasets: [{
            label: 'Volume (Ar)',
            data: this.stats.dailyStats.map(d => d.volume),
            backgroundColor: 'rgba(102, 126, 234, 0.7)',
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(102, 126, 234, 1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const value = ctx.parsed.y;
                  if (typeof value !== 'number') return '';
                  return `${ctx.dataset.label}: ${new Intl.NumberFormat('fr-MG').format(value)} Ar`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  const num = typeof value === 'number' ? value : parseFloat(value);
                  if (isNaN(num)) return value;
                  return new Intl.NumberFormat('fr-MG', {
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(num);
                }
              }
            }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  refreshData(): void { this.loadDashboardData(); }
  changePeriod(period: 'day' | 'week' | 'month'): void { this.selectedPeriod = period; this.loadDashboardData(); }
  navigateTo(route: string): void { this.router.navigate([`/admin/${route}`]); }
  logout(): void { this.authService.logout(); }
  goBack(): void {
  this.router.navigate(['/admin/dashboard']); }
  formatVolume(volume: number): string { return volume >= 1e6 ? (volume / 1e6).toFixed(1) + ' M' : volume >= 1e3 ? (volume / 1e3).toFixed(1) + ' k' : volume.toString(); }
  formatNumber(num: number): string { return new Intl.NumberFormat('fr-MG').format(num); }
  getInitials(first: string, last: string): string { return (first?.charAt(0) || '') + (last?.charAt(0) || ''); }
  getStatusClass(status: string): string { return status === 'completed' ? 'status-completed' : 'status-pending'; }
  getStatusIcon(status: string): string { return status === 'completed' ? 'check_circle' : 'pending'; }
}