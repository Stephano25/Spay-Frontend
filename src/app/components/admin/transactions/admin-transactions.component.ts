// frontend/src/app/components/admin/transactions/admin-transactions.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslationService } from '../../../services/translation.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslatePipe } from '../../../pipes/translate.pipe';

export interface Transaction {
  id: string;
  senderId?: string;
  receiverId?: string;
  sender?: { firstName: string; lastName: string; email?: string };
  receiver?: { firstName: string; lastName: string; email?: string };
  amount: number;
  type: 'transfer' | 'send' | 'receive' | 'deposit' | 'withdrawal' | 'mobile_money' | 'payment' | 'commission';
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'success' | 'processing';
  createdAt: string;
  description?: string;
}

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatToolbarModule,
    TranslatePipe
  ],
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.css']
})
export class AdminTransactionsComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  isLoading = true;
  private subscriptions: any[] = [];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Initialisation AdminTransactionsComponent');
    this.loadTransactions();

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log('🌐 AdminTransactionsComponent: Langue changée en ' + lang);
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.adminService.getAllTransactions().subscribe({
      next: (response: any) => {
        console.log('📥 Réponse brute des transactions:', response);
        
        let transactions: Transaction[] = [];
        
        if (Array.isArray(response)) {
          transactions = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          transactions = response.data;
        } else if (response && response.transactions && Array.isArray(response.transactions)) {
          transactions = response.transactions;
        } else if (response && response.results && Array.isArray(response.results)) {
          transactions = response.results;
        } else if (response && typeof response === 'object') {
          const possibleTransactions = Object.values(response).filter(item => 
            item && typeof item === 'object' && 
            'id' in item && 
            'amount' in item
          );
          if (possibleTransactions.length > 0) {
            transactions = possibleTransactions as Transaction[];
          }
        }
        
        console.log(`✅ ${transactions.length} transactions chargées`);
        this.transactions = transactions;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur chargement transactions:', error);
        this.notificationService.showError('Erreur lors du chargement des transactions');
        this.transactions = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ Méthodes pour les statistiques
  getCompletedCount(): number {
    // Filtrer les transactions complétées (completed ou success)
    return this.transactions.filter(t => t.status === 'completed' || t.status === 'success').length;
  }

  getPendingCount(): number {
    // Filtrer les transactions en attente (pending ou processing)
    return this.transactions.filter(t => t.status === 'pending' || t.status === 'processing').length;
  }

  getFailedCount(): number {
    // Filtrer les transactions échouées (failed ou cancelled)
    return this.transactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'transfer': 'swap_horiz',
      'send': 'arrow_upward',
      'receive': 'arrow_downward',
      'deposit': 'add',
      'withdraw': 'remove',
      'withdrawal': 'remove',
      'mobile_money': 'phone_android',
      'payment': 'payment',
      'commission': 'monetization_on'
    };
    return icons[type] || 'receipt';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'transfer': 'Transfert',
      'send': 'Envoi',
      'receive': 'Réception',
      'deposit': 'Dépôt',
      'withdraw': 'Retrait',
      'withdrawal': 'Retrait',
      'mobile_money': 'Mobile Money',
      'payment': 'Paiement',
      'commission': 'Commission'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': 'Complété',
      'pending': 'En attente',
      'failed': 'Échoué',
      'cancelled': 'Annulé',
      'success': 'Succès',
      'processing': 'En cours'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'completed': 'status-completed',
      'success': 'status-completed',
      'pending': 'status-pending',
      'processing': 'status-pending',
      'failed': 'status-failed',
      'cancelled': 'status-failed'
    };
    return classes[status] || 'status-pending';
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'deposit': 'type-deposit',
      'withdraw': 'type-withdraw',
      'withdrawal': 'type-withdraw',
      'transfer': 'type-transfer',
      'send': 'type-transfer',
      'receive': 'type-transfer',
      'payment': 'type-payment',
      'mobile_money': 'type-mobile',
      'commission': 'type-commission'
    };
    return classes[type] || 'type-transfer';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  refresh(): void {
    this.loadTransactions();
  }
}