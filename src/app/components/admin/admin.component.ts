import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

// Services
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

// Models
import { AdminDashboardStats } from '../../models/stats.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatButtonToggleModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  stats: AdminDashboardStats | null = null;
  isLoading = true;
  selectedPeriod: 'day' | 'week' | 'month' = 'week';
  private subscriptions: Subscription[] = [];
  private charts: Chart[] = [];

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.charts.forEach(chart => chart.destroy());
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.adminService.getDashboardStats().subscribe({
        next: (data) => {
          this.stats = data;
          setTimeout(() => this.createCharts(), 100);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement stats admin:', error);
          this.isLoading = false;
        }
      })
    );
  }

  private createCharts(): void {
    this.createActivityChart();
    this.createUsersChart();
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
              yAxisID: 'y'
            },
            {
              label: 'Volume (Ar)',
              data: this.stats.dailyStats.map(d => d.volume / 1000),
              borderColor: '#2196f3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Nombre de transactions'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Volume (milliers Ar)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
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
          labels: ['Utilisateurs actifs', 'Utilisateurs inactifs'],
          datasets: [{
            data: [
              this.stats.activeUsers,
              this.stats.totalUsers - this.stats.activeUsers
            ],
            backgroundColor: ['#4caf50', '#ff9800'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  changePeriod(period: 'day' | 'week' | 'month'): void {
    this.selectedPeriod = period;
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([`/admin/${route}`]);
  }

  logout(): void {
    this.authService.logout();
  }

  formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    }
    if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'k';
    }
    return volume.toString();
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-MG').format(num);
  }
}