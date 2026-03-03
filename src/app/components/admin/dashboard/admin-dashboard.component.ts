import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

// Services
import { AdminService, AdminDashboardStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

// Models
import { User } from '../../../models/user.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-admin-dashboard',
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
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatRippleModule
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

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.charts.forEach(chart => chart.destroy());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.user = user;
      })
    );
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    this.subscriptions.push(
      this.adminService.getDashboardStats().subscribe({
        next: (data: AdminDashboardStats) => {
          this.stats = data;
          setTimeout(() => this.createCharts(), 200);
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement stats admin:', error);
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
          labels: this.stats.dailyStats.map((d: any) => d.date),
          datasets: [
            {
              label: 'Transactions',
              data: this.stats.dailyStats.map((d: any) => d.transactions),
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4,
              yAxisID: 'y',
              fill: true
            },
            {
              label: 'Volume (kAr)',
              data: this.stats.dailyStats.map((d: any) => d.volume / 1000),
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
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    if (context.dataset.label === 'Volume (kAr)') {
                      label += context.parsed.y.toFixed(0) + ' kAr';
                    } else {
                      label += context.parsed.y;
                    }
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Nombre'
              },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Volume (milliers Ar)'
              },
              grid: { drawOnChartArea: false }
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
          labels: ['Actifs', 'Inactifs'],
          datasets: [{
            data: [
              this.stats.activeUsers,
              this.stats.totalUsers - this.stats.activeUsers
            ],
            backgroundColor: ['#4caf50', '#ff9800'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const label = context.label || '';
                  const value = context.raw as number;
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
          labels: this.stats.dailyStats.map((d: any) => d.date),
          datasets: [{
            label: 'Volume (Ar)',
            data: this.stats.dailyStats.map((d: any) => d.volume),
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
                label: (context: any) => {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('fr-MG').format(context.parsed.y) + ' Ar';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  return new Intl.NumberFormat('fr-MG', { 
                    notation: 'compact',
                    compactDisplay: 'short' 
                  }).format(Number(value));
                }
              }
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
      return (volume / 1000000).toFixed(1) + ' M';
    }
    if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + ' k';
    }
    return volume.toString();
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-MG').format(num);
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }

  getStatusClass(status: string): string {
    return status === 'completed' ? 'status-completed' : 'status-pending';
  }

  getStatusIcon(status: string): string {
    return status === 'completed' ? 'check_circle' : 'pending';
  }
}