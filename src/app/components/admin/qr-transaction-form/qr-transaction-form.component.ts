// frontend/src/app/components/admin/qr-transaction-form/qr-transaction-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AdminService, QRScanResult } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-qr-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './qr-transaction-form.component.html',
  styleUrls: ['./qr-transaction-form.component.css'],
})
export class QRTransactionFormComponent implements OnInit {
  @Input() scanResult: QRScanResult | null = null;
  @Output() transactionCompleted = new EventEmitter<{ success: boolean; message: string; data?: any }>();
  @Output() cancelled = new EventEmitter<void>();

  users: any[] = [];
  selectedUserId: string = '';
  amount: number = 0;
  description: string = '';
  isLoading = true;
  isSubmitting = false;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    if (this.scanResult?.amount) {
      this.amount = this.scanResult.amount;
    }
    this.loadUsers();
    this.description = this.scanResult?.action === 'deposit' 
      ? 'Dépôt via QR Code' 
      : 'Retrait via QR Code';
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.isLoading = false;
      },
    });
  }

  getSelectedUser(): any {
    return this.users.find((u) => u.id === this.selectedUserId);
  }

  isBalanceInsufficient(): boolean {
    if (this.scanResult?.action === 'withdraw') {
      const user = this.getSelectedUser();
      return user && (user.balance || 0) < this.amount;
    }
    return false;
  }

  submit(): void {
    if (!this.selectedUserId) {
      this.notificationService.showError('Veuillez sélectionner un utilisateur');
      return;
    }

    if (!this.amount || this.amount < 100) {
      this.notificationService.showError('Le montant minimum est de 100 Ar');
      return;
    }

    const user = this.getSelectedUser();
    if (!user) {
      this.notificationService.showError('Utilisateur non trouvé');
      return;
    }

    if (this.scanResult?.action === 'withdraw' && user.balance < this.amount) {
      this.notificationService.showError('Solde insuffisant');
      return;
    }

    const actionLabel = this.scanResult?.action === 'deposit' ? 'dépôt' : 'retrait';
    const confirmMsg = `Confirmer le ${actionLabel} de ${this.formatAmount(this.amount)} Ar sur le compte de ${user.firstName} ${user.lastName} ?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    this.isSubmitting = true;

    const qrData = this.scanResult ? JSON.stringify(this.scanResult) : '';

    if (this.scanResult?.action === 'deposit') {
      this.adminService.depositMoney(this.selectedUserId, this.amount, this.description, qrData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.transactionCompleted.emit({
            success: true,
            message: `Dépôt de ${this.formatAmount(this.amount)} Ar effectué avec succès`,
            data: response,
          });
          this.notificationService.showSuccess(`Dépôt de ${this.formatAmount(this.amount)} Ar effectué`);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.transactionCompleted.emit({
            success: false,
            message: error?.error?.message || 'Erreur lors du dépôt',
          });
          this.notificationService.showError(error?.error?.message || 'Erreur lors du dépôt');
        },
      });
    } else {
      this.adminService.withdrawMoney(this.selectedUserId, this.amount, this.description, qrData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.transactionCompleted.emit({
            success: true,
            message: `Retrait de ${this.formatAmount(this.amount)} Ar effectué avec succès`,
            data: response,
          });
          this.notificationService.showSuccess(`Retrait de ${this.formatAmount(this.amount)} Ar effectué`);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.transactionCompleted.emit({
            success: false,
            message: error?.error?.message || 'Erreur lors du retrait',
          });
          this.notificationService.showError(error?.error?.message || 'Erreur lors du retrait');
        },
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  getUserInitials(user: any): string {
    return (user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '');
  }
}