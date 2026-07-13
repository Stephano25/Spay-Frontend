// frontend/src/app/components/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { AdminService, AdminDashboardStats, QRScanResult, QRCodeResponse } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslationService } from '../../../services/translation.service';
import { User } from '../../../models/user.model';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { QRScannerComponent } from '../qr-scanner/qr-scanner.component';
import { QRTransactionFormComponent } from '../qr-transaction-form/qr-transaction-form.component';
import { QRGeneratorComponent } from '../qr-generator/qr-generator.component';

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
import { BaseComponent } from 'src/app/components/base.component';

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
    QRScannerComponent,
    QRTransactionFormComponent,
    QRGeneratorComponent,
    TranslatePipe
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  user: User | null = null;
  stats: AdminDashboardStats | null = null;
  isLoading = true;
  isSuperAdmin = false;
  isAdmin = false;
  private charts: Chart[] = [];
  private chartInitialized = false;
  private chartCreationTimeout: any = null;

  // QR Code properties
  showQRScanner: boolean = false;
  qrScanResult: QRScanResult | null = null;
  showTransactionForm: boolean = false;

  // QR Generator properties
  showQRGenerator: boolean = false;
  qrGeneratorType: 'deposit' | 'withdraw' = 'deposit';

  get menuItems() {
    const baseMenu = [
      { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
      { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/admin/wallet' },
      { icon: 'people', label: 'Amis', route: '/admin/friends' },
      { icon: 'chat', label: 'Messages', route: '/admin/chat' },
      { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
      { icon: 'receipt', label: 'Transactions', route: '/admin/transactions' },
      { icon: 'bar_chart', label: 'Statistiques', route: '/admin/stats' },
      { icon: 'person', label: 'Mon Profil', route: '/admin/profile' },
      { icon: 'settings', label: 'Paramètres', route: '/admin/settings' },
    ];

    if (this.isSuperAdmin) {
      return [
        ...baseMenu,
        { icon: 'admin_panel_settings', label: 'Administrateurs', route: '/admin/admins' },
        { icon: 'account_balance_wallet', label: 'Dépôt Admin', route: '/admin/deposit' },
        { icon: 'account_balance_wallet', label: 'Retrait Admin', route: '/admin/withdraw' },
      ];
    }
    return baseMenu;
  }

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private chatService: ChatService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    super();
  }

  // ✅ UN SEUL ngOnInit
  override ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();

    // ✅ S'abonner aux changements de langue
    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 AdminDashboard: Langue changée en ${lang}`);
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.chartInitialized = true;
      this.createCharts();
    }, 500);
  }

  override ngOnDestroy(): void {
    if (this.chartCreationTimeout) {
      clearTimeout(this.chartCreationTimeout);
      this.chartCreationTimeout = null;
    }
    
    this.destroyAllCharts();
    super.ngOnDestroy();
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user) => {
        this.user = user;
        this.isSuperAdmin = user?.role === 'super_admin';
        this.isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
        
        if (user && user.role !== 'admin' && user.role !== 'super_admin') {
          this.router.navigate(['/user']);
        }
      }),
    );
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        
        if (this.isSuperAdmin || this.isAdmin) {
          this.loadCommissionStats();
        }
        
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
          dailyStats: this.generateDefaultDailyStats(),
          topUsers: [],
          totalAdmins: 0,
          totalSuperAdmins: 0,
          adminTransactions: 0,
          adminVolume: 0,
          myAdminTransactions: 0,
          myAdminVolume: 0,
          userRole: this.isSuperAdmin ? 'super_admin' : 'admin',
          totalCommission: 0,
          commissionTransactions: 0,
          recentCommissions: [],
          commissionRate: 0.5,
          myCommission: 0,
          myCommissionTransactions: 0,
        };
        
        if (this.isSuperAdmin || this.isAdmin) {
          this.loadCommissionStats();
        }
        
        setTimeout(() => this.createCharts(), 500);
      },
    });
  }

  private loadCommissionStats(): void {
    this.adminService.getCommissionStats().subscribe({
      next: (commissionData) => {
        if (this.stats) {
          this.stats.totalCommission = commissionData.totalCommission || 0;
          this.stats.commissionTransactions = commissionData.commissionTransactions || 0;
          this.stats.recentCommissions = commissionData.recentCommissions || [];
          this.stats.commissionRate = commissionData.commissionRate || 0.5;
          this.stats.myCommission = commissionData.myCommission || 0;
          this.stats.myCommissionTransactions = commissionData.myCommissionTransactions || 0;
          this.stats.userRole = commissionData.userRole || this.stats.userRole;
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement commissions:', err);
        if (this.stats) {
          this.stats.totalCommission = 0;
          this.stats.commissionTransactions = 0;
          this.stats.recentCommissions = [];
          this.stats.commissionRate = 0.5;
          this.stats.myCommission = 0;
          this.stats.myCommissionTransactions = 0;
        }
      }
    });
  }

  private loadDashboardDataSilent(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        if (this.isSuperAdmin || this.isAdmin) {
          this.loadCommissionStats();
        }
        this.updateCharts();
      },
      error: (err) => console.error('❌ Erreur refresh silencieux:', err),
    });
  }

  private destroyAllCharts(): void {
    this.charts.forEach((chart) => {
      try {
        chart.destroy();
      } catch (e) {
        // Ignorer
      }
    });
    this.charts = [];
  }

  private updateCharts(): void {
    if (!this.chartInitialized) return;
    this.destroyAllCharts();
    if (this.chartCreationTimeout) {
      clearTimeout(this.chartCreationTimeout);
    }
    this.chartCreationTimeout = setTimeout(() => {
      this.createCharts();
      this.chartCreationTimeout = null;
    }, 200);
  }

  private createCharts(): void {
    this.destroyAllCharts();
    setTimeout(() => {
      this.createActivityChart();
      this.createUsersChart();
      this.createRevenueChart();
    }, 100);
  }

  private createActivityChart(): void {
    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('⚠️ activityChart non trouvé');
      return;
    }

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (e) {
        // Ignorer
      }
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
        userRole: this.isSuperAdmin ? 'super_admin' : 'admin',
        totalCommission: 0,
        commissionTransactions: 0,
        recentCommissions: [],
        commissionRate: 0.5,
        myCommission: 0,
        myCommissionTransactions: 0,
      };
    }

    try {
      const stats = this.stats;
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: stats.dailyStats.map((d) => d.date),
          datasets: [
            {
              label: 'Transactions',
              data: stats.dailyStats.map((d) => d.transactions || 0),
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
              data: stats.dailyStats.map((d) => (d.volume || 0) / 1000),
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
    const canvas = document.getElementById('usersChart') as HTMLCanvasElement;
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (e) {
        // Ignorer
      }
    }

    try {
      const total = this.stats?.totalUsers || 0;
      const active = this.stats?.activeUsers || 0;

      const chart = new Chart(canvas, {
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
    } catch (error) {
      console.error('❌ Erreur création graphique utilisateurs:', error);
    }
  }

  private createRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (e) {
        // Ignorer
      }
    }

    try {
      const stats = this.stats;
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: stats?.dailyStats?.map((d) => d.date) || [],
          datasets: [
            {
              label: 'Volume (Ar)',
              data: stats?.dailyStats?.map((d) => d.volume || 0) || [],
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
    } catch (error) {
      console.error('❌ Erreur création graphique revenus:', error);
    }
  }

  // ============================================================
  // QR CODE METHODS
  // ============================================================
  
  openQRScanner(type: 'deposit' | 'withdraw'): void {
    this.showQRScanner = true;
    this.qrScanResult = null;
    this.showTransactionForm = false;
  }

  onQRScanResult(qrData: string): void {
    this.showQRScanner = false;
    
    this.adminService.scanQRCode(qrData).subscribe({
      next: (result) => {
        this.qrScanResult = result;
        this.showTransactionForm = true;
        this.notificationService.showSuccess('QR Code scanné avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur scan QR:', error);
        this.notificationService.showError(error?.error?.message || 'QR Code invalide');
      },
    });
  }

  closeQRScanner(): void {
    this.showQRScanner = false;
  }

  closeTransactionForm(): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
  }

  onTransactionCompleted(result: { success: boolean; message: string; data?: any }): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
    if (result.success) {
      this.refreshData();
    }
  }

  openQRGenerator(type: 'deposit' | 'withdraw'): void {
    this.qrGeneratorType = type;
    this.showQRGenerator = true;
  }

  closeQRGenerator(): void {
    this.showQRGenerator = false;
  }

  onQRGenerated(response: QRCodeResponse): void {
    this.notificationService.showSuccess(
      `QR Code de ${response.action === 'deposit' ? 'dépôt' : 'retrait'} généré avec succès`
    );
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