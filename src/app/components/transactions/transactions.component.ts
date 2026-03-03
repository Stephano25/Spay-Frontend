import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu'; // AJOUTER CET IMPORT

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatTabsModule,
    MatMenuModule, // AJOUTER ICI
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  selectedTabIndex = 0;
  
  transactions = [
    {
      id: 1,
      type: 'sent',
      description: 'Paiement restaurant',
      amount: 25000,
      date: new Date(),
      status: 'completed',
      recipient: 'Restaurant La Varangue'
    },
    {
      id: 2,
      type: 'received',
      description: 'Virement de Jean',
      amount: 50000,
      date: new Date(Date.now() - 86400000),
      status: 'completed',
      sender: 'Jean Rakoto'
    },
    {
      id: 3,
      type: 'sent',
      description: 'Achat en ligne',
      amount: 15000,
      date: new Date(Date.now() - 172800000),
      status: 'completed',
      recipient: 'Amazon'
    },
    {
      id: 4,
      type: 'mobile_money',
      description: 'Retrait MVola',
      amount: 20000,
      date: new Date(Date.now() - 259200000),
      status: 'completed',
      operator: 'MVola',
      phoneNumber: '0341234567'
    },
    {
      id: 5,
      type: 'received',
      description: 'Paiement de Marie',
      amount: 35000,
      date: new Date(Date.now() - 345600000),
      status: 'pending',
      sender: 'Marie Rabe'
    },
    {
      id: 6,
      type: 'sent',
      description: 'Transfert à Pierre',
      amount: 12000,
      date: new Date(Date.now() - 432000000),
      status: 'completed',
      recipient: 'Pierre Randria'
    },
    {
      id: 7,
      type: 'scan_pay',
      description: 'Paiement par scan',
      amount: 8500,
      date: new Date(Date.now() - 518400000),
      status: 'completed',
      recipient: 'Boutique ABC'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Charger les transactions depuis l'API plus tard
  }

  get filteredTransactions() {
    if (this.selectedTabIndex === 0) {
      return this.transactions; // Toutes
    } else if (this.selectedTabIndex === 1) {
      return this.transactions.filter(t => t.type === 'received'); // Reçus
    } else if (this.selectedTabIndex === 2) {
      return this.transactions.filter(t => t.type === 'sent'); // Envoyés
    }
    return this.transactions;
  }

  getTransactionIcon(type: string): string {
    switch(type) {
      case 'sent': return 'arrow_upward';
      case 'received': return 'arrow_downward';
      case 'mobile_money': return 'phone_android';
      case 'scan_pay': return 'qr_code_scanner';
      default: return 'swap_horiz';
    }
  }

  getTransactionColor(type: string): string {
    switch(type) {
      case 'sent': return 'warn';
      case 'received': return 'accent';
      case 'mobile_money': return 'primary';
      case 'scan_pay': return 'primary';
      default: return 'primary';
    }
  }

  getStatusText(status: string): string {
    return status === 'completed' ? 'Complété' : 'En cours';
  }

  getCounterparty(transaction: any): string {
    if (transaction.recipient) return `À: ${transaction.recipient}`;
    if (transaction.sender) return `De: ${transaction.sender}`;
    if (transaction.operator) return `${transaction.operator} ${transaction.phoneNumber}`;
    return '';
  }
}