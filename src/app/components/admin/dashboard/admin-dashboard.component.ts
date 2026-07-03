import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { AdminService, AdminDashboardStats } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { User } from '../../../models/user.model';

import { TranslatePipe } from '../../../pipes/translate.pipe';

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
  isSuperAdmin = false;
  private subscriptions: Subscription[] = [];
  private charts: Chart[] = [];
  private chartInitialized = false;

  // Menu items selon le rôle
  adminMenuItems = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
    { icon: 'person', label: 'Mon Profil', route: '/admin/profile' },
    { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
  ];

  superAdminMenuItems = [
    { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
    { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
    { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
    { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
    { icon: 'admin_panel_settings', label: 'Administrateurs', route: '/admin/admins' },
    { icon: 'person', label: 'Mon Profil', route: '/admin/profile' },
    { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();

    this.subscriptions.push(
      this.chatService.onlineStatus$.subscribe(() => {
        this.loadDashboardDataSilent();
      }),
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.chartInitialized = true;
      this.createCharts();
    }, 800);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.charts.forEach((chart) => chart.destroy());
  }

  get menuItems() {
    return this.isSuperAdmin ? this.superAdminMenuItems : this.adminMenuItems;
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        this.user = user;
        this.isSuperAdmin = user?.role === 'super_admin';
        if (user && user.role !== 'admin' && user.role !== 'super_admin') {
          this.router.navigate(['/user']);
        }
      }),
    );
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    console.log('📊 Chargement des données du dashboard...');
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        console.log('✅ Données dashboard reçues:', data);
        this.stats = data;
        this.isLoading = false;
        setTimeout(() => this.createCharts(), 300);
      },
      error: (err) => {
        console.error('❌ Erreur chargement dashboard:', err);
        this.isLoading = false;
        this.stats = {
          totalUsers: 0,
          activeUsers: 0,
          totalTransactions: 0,
          totalVolume: 0,
          recentUsers: [],
          recentTransactions: [],
          dailyStats: [],
          topUsers: [],
          totalAdmins: 0,
          totalSuperAdmins: 0,
          adminTransactions: 0,
          adminVolume: 0,
          myAdminTransactions: 0,
          myAdminVolume: 0,
        };
      },
    });
  }

  private loadDashboardDataSilent(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        console.log('🔄 Refresh silencieux des données');
        this.stats = data;
        this.updateCharts();
      },
      error: (err) => console.error('❌ Erreur refresh silencieux:', err),
    });
  }

  private updateCharts(): void {
    if (!this.chartInitialized) return;
    this.charts.forEach((chart) => {
      try {
        chart.destroy();
      } catch (e) {
        // Ignorer les erreurs de destruction
      }
    });
    this.charts = [];
    this.createCharts();
  }

  private createCharts(): void {
    setTimeout(() => {
      this.createActivityChart();
      this.createUsersChart();
      this.createRevenueChart();
    }, 100);
  }

  private createActivityChart(): void {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ activityChart non trouvé');
      return;
    }

    if (!this.stats?.dailyStats || this.stats.dailyStats.length === 0) {
      this.stats = this.stats || {
        totalUsers: 0,
        activeUsers: 0,
        totalTransactions: 0,
        totalVolume: 0,
        recentUsers: [],
        recentTransactions: [],
        dailyStats: this.generateDefaultDailyStats(),
        topUsers: [],
        totalAdmins: 0,
        totalSuperAdmins: 0,
        adminTransactions: 0,
        adminVolume: 0,
        myAdminTransactions: 0,
        myAdminVolume: 0,
      };
    }

    try {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.stats.dailyStats.map((d) => d.date),
          datasets: [
            {
              label: 'Transactions',
              data: this.stats.dailyStats.map((d) => d.transactions || 0),
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
              data: this.stats.dailyStats.map((d) => (d.volume || 0) / 1000),
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
              backgroundColor: 'rgba(255,255,255,0.9)',
              titleColor: '#1a0e2e',
              bodyColor: '#4a3a5e',
              borderColor: 'rgba(124,58,237,0.15)',
              borderWidth: 1,
              cornerRadius: 8,
            },
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { color: '#8a7a9e' },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              grid: { drawOnChartArea: false },
              ticks: { color: '#8a7a9e' },
            },
            x: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { color: '#8a7a9e' },
            },
          },
        },
      });
      this.charts.push(chart);
      console.log('✅ Graphique activité créé');
    } catch (error) {
      console.error('❌ Erreur création graphique activité:', error);
    }
  }

  private generateDefaultDailyStats(): any[] {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      stats.push({
        date: d.toISOString().slice(0, 10),
        users: 0,
        transactions: 0,
        volume: 0,
      });
    }
    return stats;
  }

  private createUsersChart(): void {
    const ctx = document.getElementById('usersChart') as HTMLCanvasElement;
    if (!ctx) return;

    try {
      const total = this.stats?.totalUsers || 0;
      const active = this.stats?.activeUsers || 0;

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Actifs', 'Inactifs'],
          datasets: [
            {
              data: [active, total - active],
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
              callbacks: {
                label: (ctx) => {
                  const label = ctx.label || '';
                  const value = ctx.raw as number;
                  const total = this.stats?.totalUsers || 1;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
        },
      });
      this.charts.push(chart);
      console.log('✅ Graphique utilisateurs créé');
    } catch (error) {
      console.error('❌ Erreur création graphique utilisateurs:', error);
    }
  }

  private createRevenueChart(): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.stats?.dailyStats?.map((d) => d.date) || [],
          datasets: [
            {
              label: 'Volume (Ar)',
              data: this.stats?.dailyStats?.map((d) => d.volume || 0) || [],
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
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                color: '#8a7a9e',
                callback: (value: any) => {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + ' M';
                  if (value >= 1000) return (value / 1000).toFixed(1) + ' k';
                  return value;
                },
              },
            },
            x: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { color: '#8a7a9e' },
            },
          },
        },
      });
      this.charts.push(chart);
      console.log('✅ Graphique revenus créé');
    } catch (error) {
      console.error('❌ Erreur création graphique revenus:', error);
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