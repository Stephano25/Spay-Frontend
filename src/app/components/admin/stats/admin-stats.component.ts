// frontend/src/app/components/admin/stats/admin-stats.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService, AdminDashboardStats } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslationService } from '../../../services/translation.service';
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
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.css']
})
export class AdminStatsComponent implements OnInit, OnDestroy {
  stats: AdminDashboardStats | null = null;
  isLoading = true;
  private chart: Chart | null = null;
  private subscriptions: any[] = [];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Initialisation AdminStatsComponent');
    this.loadStats();

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log('🌐 AdminStatsComponent: Langue changée en ' + lang);
        this.cdr.detectChanges();
        setTimeout(() => this.createChart(), 300);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  loadStats(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('✅ Statistiques reçues:', stats);
        this.stats = stats;
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.createChart(), 300);
      },
      error: (error) => {
        console.error('❌ Erreur chargement stats:', error);
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createChart(): void {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas activityChart non trouvé');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Récupérer les données des transactions récentes
    const transactions = this.stats?.recentTransactions || [];
    
    // Générer les 7 derniers jours
    const last7Days = this.getLast7Days();
    const labels = last7Days.map(d => 
      d.toLocaleDateString('fr-MG', { day: '2-digit', month: 'short' })
    );
    
    // Compter les transactions par jour
    const transactionsPerDay = last7Days.map(day => {
      return transactions.filter((t: any) => {
        const date = new Date(t.createdAt);
        return date.toDateString() === day.toDateString();
      }).length;
    });

    // Données de volume par jour
    const volumePerDay = last7Days.map(day => {
      return transactions.filter((t: any) => {
        const date = new Date(t.createdAt);
        return date.toDateString() === day.toDateString();
      }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Transactions',
            data: transactionsPerDay,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Volume (Ar)',
            data: volumePerDay,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 16,
              font: {
                size: 11,
                weight: 500 // ✅ Correction: utiliser un nombre au lieu d'une chaîne
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                let value = context.parsed.y as number;
                if (context.datasetIndex === 1) {
                  return label + ': ' + new Intl.NumberFormat('fr-MG').format(value) + ' Ar';
                }
                return label + ': ' + value;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 10 }
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            ticks: {
              font: { size: 10 },
              callback: function(value) {
                const numValue = value as number;
                if (numValue >= 1000000) {
                  return (numValue / 1000000).toFixed(1) + 'M';
                }
                if (numValue >= 1000) {
                  return (numValue / 1000).toFixed(0) + 'k';
                }
                return numValue;
              }
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  private getLast7Days(): Date[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-MG').format(num || 0);
  }

  formatAmount(amount: number): string {
    const value = amount || 0;
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + ' M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + ' k';
    }
    return value.toString();
  }

  getRecentTransactionsCount(): number {
    return this.stats?.recentTransactions?.length || 0;
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  refresh(): void {
    this.loadStats();
  }
}