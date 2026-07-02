// frontend/src/app/components/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { AdminService, AdminDashboardStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { User } from '../../../models/user.model';

// ✅ Import du pipe standalone
import { TranslatePipe } from '../../../pipes/translate.pipe';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRippleModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    TranslatePipe,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  user: User | null = null;
  stats: AdminDashboardStats | null = null;
  isLoading = true;
  private subscriptions: Subscription[] = [];
  private charts: Chart[] = [];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();

    this.subscriptions.push(
      this.chatService.onlineStatus$.subscribe(() => {
        this.loadDashboardDataSilent();
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.createCharts(), 500);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.charts.forEach((chart) => chart.destroy());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        this.user = user;
        if (user && user.role !== 'admin' && user.role !== 'super_admin') {
          this.router.navigate(['/user']);
        }
      })
    );
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        setTimeout(() => this.createCharts(), 200);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement dashboard:', err);
        this.isLoading = false;
      },
    });
  }

  private loadDashboardDataSilent(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.updateCharts();
      },
      error: (err) => console.error('❌ Erreur refresh:', err),
    });
  }

  private updateCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
    this.createCharts();
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
          labels: this.stats.dailyStats.map((d) => d.date),
          datasets: [
            {
              label: 'Transactions',
              data: this.stats.dailyStats.map((d) => d.transactions),
              borderColor: '#7c3aed',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              tension: 0.4,
              yAxisID: 'y',
              fill: true,
              pointBackgroundColor: '#7c3aed',
              pointBorderColor: '#7c3aed',
            },
            {
              label: 'Volume (kAr)',
              data: this.stats.dailyStats.map((d) => d.volume / 1000),
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              tension: 0.4,
              yAxisID: 'y1',
              fill: true,
              borderDash: [5, 5],
              pointBackgroundColor: '#4f46e5',
              pointBorderColor: '#4f46e5',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top',
              labels: { usePointStyle: true, padding: 20 },
            },
            tooltip: {
              backgroundColor: 'var(--surface)',
              titleColor: 'var(--text)',
              bodyColor: 'var(--text-2)',
              borderColor: 'var(--border)',
              borderWidth: 1,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  let label = ctx.dataset.label || '';
                  if (label) label += ': ';
                  if (ctx.parsed.y !== null) {
                    if (ctx.dataset.label === 'Volume (kAr)')
                      label += ctx.parsed.y.toFixed(0) + ' kAr';
                    else label += ctx.parsed.y;
                  }
                  return label;
                },
              },
            },
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Nombre',
                color: 'var(--text-3)',
              },
              grid: { color: 'var(--border)' },
              ticks: { color: 'var(--text-3)' },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Volume (milliers Ar)',
                color: 'var(--text-3)',
              },
              grid: { drawOnChartArea: false },
              ticks: { color: 'var(--text-3)' },
            },
            x: {
              grid: { color: 'var(--border)' },
              ticks: { color: 'var(--text-3)' },
            },
          },
        },
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
          datasets: [
            {
              data: [
                this.stats.activeUsers,
                this.stats.totalUsers - this.stats.activeUsers,
              ],
              backgroundColor: ['#7c3aed', '#e5e7eb'],
              borderWidth: 2,
              borderColor: 'var(--surface)',
              hoverOffset: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, padding: 16 },
            },
            tooltip: {
              backgroundColor: 'var(--surface)',
              titleColor: 'var(--text)',
              bodyColor: 'var(--text-2)',
              borderColor: 'var(--border)',
              borderWidth: 1,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const label = ctx.label || '';
                  const value = ctx.raw as number;
                  const total = this.stats?.totalUsers || 0;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
        },
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
          labels: this.stats.dailyStats.map((d) => d.date),
          datasets: [
            {
              label: 'Volume (Ar)',
              data: this.stats.dailyStats.map((d) => d.volume),
              backgroundColor: 'rgba(124, 58, 237, 0.7)',
              borderRadius: 6,
              hoverBackgroundColor: 'rgba(124, 58, 237, 1)',
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'var(--surface)',
              titleColor: 'var(--text)',
              bodyColor: 'var(--text-2)',
              borderColor: 'var(--border)',
              borderWidth: 1,
              cornerRadius: 8,
              callbacks: {
                label: (ctx: any) => {
                  const value = ctx.parsed.y;
                  if (typeof value !== 'number') return '';
                  return `${ctx.dataset.label}: ${new Intl.NumberFormat(
                    'fr-MG'
                  ).format(value)} Ar`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'var(--border)' },
              ticks: {
                color: 'var(--text-3)',
                callback: (value: any) => {
                  const num = typeof value === 'number' ? value : parseFloat(value);
                  if (isNaN(num)) return value;
                  return new Intl.NumberFormat('fr-MG', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(num);
                },
              },
            },
            x: {
              grid: { color: 'var(--border)' },
              ticks: { color: 'var(--text-3)' },
            },
          },
        },
      });
      this.charts.push(chart);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([`/admin/${route}`]);
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  formatVolume(volume: number): string {
    if (volume >= 1e6) {
      return (volume / 1e6).toFixed(1) + ' M';
    }
    if (volume >= 1e3) {
      return (volume / 1e3).toFixed(1) + ' k';
    }
    return volume.toString();
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-MG').format(num);
  }

  getInitials(first: string, last: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }
}