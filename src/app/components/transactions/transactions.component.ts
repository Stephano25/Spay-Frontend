import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

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
    MatCardModule
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  transactions = [
    {
      type: 'sent',
      description: 'Paiement restaurant',
      amount: 25000,
      date: new Date(),
      status: 'completed'
    },
    {
      type: 'received',
      description: 'Virement de Jean',
      amount: 50000,
      date: new Date(Date.now() - 86400000),
      status: 'completed'
    },
    {
      type: 'sent',
      description: 'Achat en ligne',
      amount: 15000,
      date: new Date(Date.now() - 172800000),
      status: 'completed'
    },
    {
      type: 'mobile_money',
      description: 'Retrait MVola',
      amount: 20000,
      date: new Date(Date.now() - 259200000),
      status: 'completed',
      operator: 'MVola'
    },
    {
      type: 'received',
      description: 'Paiement de Marie',
      amount: 35000,
      date: new Date(Date.now() - 345600000),
      status: 'pending'
    },
    {
      type: 'sent',
      description: 'Transfert à Pierre',
      amount: 12000,
      date: new Date(Date.now() - 432000000),
      status: 'completed'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Charger les transactions depuis l'API
  }

  getTransactionIcon(type: string): string {
    switch(type) {
      case 'sent': return 'arrow_upward';
      case 'received': return 'arrow_downward';
      case 'mobile_money': return 'phone_android';
      default: return 'swap_horiz';
    }
  }

  getStatusColor(status: string): string {
    return status === 'completed' ? 'primary' : 'warn';
  }
}