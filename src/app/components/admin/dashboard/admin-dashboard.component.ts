import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

// Services
import { AdminAuthService } from '../../../services/admin-auth.service';
import { AdminService } from '../../../services/admin.service'; // CORRECT

// Models
import { Admin } from '../../../models/admin.model';
import { AdminDashboardStats } from '../../../models/stats.model';

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
  admin: Admin | null = null;
  stats: AdminDashboardStats | null = null;
  isLoading = true;
  selectedPeriod: 'day' | 'week' | 'month' = 'week';
  currentDate = new Date();
  
  private subscriptions: Subscription[] = [];
  private charts: Chart[] = [];

  // Données simulées en attendant l'API
  mockStats: AdminDashboardStats = {
    totalUsers: 15420,
    activeUsers: 8234,
    totalTransactions: 45678,
    totalVolume: 125000000,
    recentUsers: [
      { 
        id: '1', 
        firstName: 'Jean', 
        lastName: 'Rakoto', 
        email: 'jean.rakoto@email.com', 
        role: 'user', 
        isActive: true, 
        createdAt: new Date(), 
        balance: 50000, 
        qrCode: 'QR001', 
        friends: [], 
        phoneNumber: '0341234567' 
      },
      { 
        id: '2', 
        firstName: 'Marie', 
        lastName: 'Rabe', 
        email: 'marie.rabe@email.com', 
        role: 'user', 
        isActive: true, 
        createdAt: new Date(), 
        balance: 75000, 
        qrCode: 'QR002', 
        friends: [], 
        phoneNumber: '0347654321' 
      },
      { 
        id: '3', 
        firstName: 'Pierre', 
        lastName: 'Randria', 
        email: 'pierre@email.com', 
        role: 'user', 
        isActive: true, 
        createdAt: new Date(), 
        balance: 30000, 
        qrCode: 'QR003', 
        friends: [], 
        phoneNumber: '033456789' 
      }
    ],
    recentTransactions: [
      { 
        id: 't1', 
        senderId: '1', 
        receiverId: '2', 
        type: 'transfer', 
        amount: 25000, 
        status: 'completed', 
        createdAt: new Date() 
      },
      { 
        id: 't2', 
        senderId: '3', 
        receiverId: '1', 
        type: 'payment', 
        amount: 15000, 
        status: 'completed', 
        createdAt: new Date() 
      },
      { 
        id: 't3', 
        senderId: '2', 
        receiverId: '3', 
        type: 'mobile_money', 
        amount: 50000, 
        status: 'pending', 
        createdAt: new Date() 
      }
    ],
    dailyStats: [
      { date: 'Lun', users: 120, transactions: 450, volume: 12500000 },
      { date: 'Mar', users: 135, transactions: 520, volume: 14800000 },
      { date: 'Mer', users: 142, transactions: 580, volume: 16200000 },
      { date: 'Jeu', users: 138, transactions: 540, volume: 15100000 },
      { date: 'Ven', users: 155, transactions: 620, volume: 17800000 },
      { date: 'Sam', users: 168, transactions: 680, volume: 19500000 },
      { date: 'Dim', users: 98, transactions: 320, volume: 8900000 }
    ],
    topUsers: [
      { userId: '1', name: 'Jean Rakoto', transactionCount: 45, totalVolume: 1250000 },
      { userId: '2', name: 'Marie Rabe', transactionCount: 38, totalVolume: 980000 },
      { userId: '3', name: 'Pierre Randria', transactionCount: 32, totalVolume: 850000 }
    ]
  };

  constructor(
    private adminAuthService: AdminAuthService,
    private adminService: AdminService, // CORRECT
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAdminData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.charts.forEach(chart => chart.destroy());
  }

  private loadAdminData(): void {
    this.subscriptions.push(
      this.adminAuthService.admin.subscribe((admin: Admin | null) => {
        this.admin = admin;
      })
    );
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Simulation de chargement (à remplacer par l'appel API réel)
    setTimeout(() => {
      this.stats = this.mockStats;
      setTimeout(() => this.createCharts(), 200);
      this.isLoading = false;
    }, 1000);
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
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { usePointStyle: true }
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
            borderWidth: 0
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
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
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
    this.adminAuthService.logout();
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