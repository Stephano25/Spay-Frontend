import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminDataService, Transaction } from '../../../services/admin-data.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

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
    MatToolbarModule
  ],
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.css']
})
export class AdminTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = true;

  constructor(
    private adminDataService: AdminDataService,
    private router: Router
  ) {}

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

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}