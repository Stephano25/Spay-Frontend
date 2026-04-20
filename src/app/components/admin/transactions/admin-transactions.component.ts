import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService, Transaction } from '../../../services/admin-data.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="transactions-container">
      <mat-card class="transactions-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>receipt</mat-icon>
            Gestion des transactions
          </mat-card-title>
          <mat-card-subtitle>Total: {{ transactions.length }} transactions</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="loading-container" *ngIf="isLoading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des transactions...</p>
          </div>

          <div *ngIf="!isLoading" class="table-container">
            <table class="transactions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Expéditeur</th>
                  <th>Destinataire</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let transaction of transactions">
                  <td class="id-cell">{{ transaction.id | slice:0:8 }}...</td>
                  <td>{{ transaction.sender?.firstName || 'N/A' }} {{ transaction.sender?.lastName || '' }}</td>
                  <td>{{ transaction.receiver?.firstName || 'N/A' }} {{ transaction.receiver?.lastName || '' }}</td>
                  <td class="amount">{{ formatAmount(transaction.amount) }} Ar</td>
                  <td>
                    <mat-chip [class]="'type-' + transaction.type">
                      <mat-icon>{{ getTypeIcon(transaction.type) }}</mat-icon>
                      {{ getTypeLabel(transaction.type) }}
                    </mat-chip>
                  </td>
                  <td>
                    <mat-chip [class]="'status-' + transaction.status">
                      {{ getStatusLabel(transaction.status) }}
                    </mat-chip>
                  </td>
                  <td>{{ transaction.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="transactions.length === 0" class="empty-state">
              <mat-icon>receipt</mat-icon>
              <h3>Aucune transaction</h3>
              <p>Aucune transaction n'a été effectuée pour le moment</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .transactions-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .transactions-card {
      border-radius: 16px;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }
    .table-container {
      overflow-x: auto;
    }
    .transactions-table {
      width: 100%;
      border-collapse: collapse;
    }
    .transactions-table th,
    .transactions-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .transactions-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    .id-cell {
      font-family: monospace;
      font-size: 12px;
      color: #666;
    }
    .amount {
      font-weight: 600;
      color: #4caf50;
    }
    .type-transfer mat-icon, .type-send mat-icon { color: #2196f3; }
    .type-deposit mat-icon { color: #4caf50; }
    .type-withdrawal mat-icon { color: #f44336; }
    .type-mobile_money mat-icon { color: #ff9800; }
    .status-completed { background: #4caf50; color: white; }
    .status-pending { background: #ff9800; color: white; }
    .status-failed { background: #f44336; color: white; }
    .empty-state {
      text-align: center;
      padding: 60px;
      color: #999;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
  `]
})
export class AdminTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = true;

  constructor(private adminDataService: AdminDataService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.adminDataService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement transactions:', error);
        this.isLoading = false;
      }
    });
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'transfer': 'swap_horiz',
      'send': 'arrow_upward',
      'receive': 'arrow_downward',
      'deposit': 'add',
      'withdrawal': 'remove',
      'mobile_money': 'phone_android'
    };
    return icons[type] || 'receipt';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'transfer': 'Transfert',
      'send': 'Envoi',
      'receive': 'Réception',
      'deposit': 'Dépôt',
      'withdrawal': 'Retrait',
      'mobile_money': 'Mobile Money'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': 'Complété',
      'pending': 'En attente',
      'failed': 'Échoué',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
}