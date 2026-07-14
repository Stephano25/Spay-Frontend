// frontend/src/app/components/admin/qr-transaction-form/qr-transaction-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, QRScanResult } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

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
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './qr-transaction-form.component.html',
  styleUrls: ['./qr-transaction-form.component.css'],
})
export class QRTransactionFormComponent implements OnInit, OnDestroy {
  @Input() scanResult: QRScanResult | null = null;
  @Output() transactionCompleted = new EventEmitter<{ success: boolean; message: string; data?: any }>();
  @Output() cancelled = new EventEmitter<void>();

  users: any[] = [];
  selectedUserId: string = '';
  amount: number = 0;
  description: string = '';
  isLoading = true;
  isSubmitting = false;
  isAdminTransaction = false;
  private isDestroyed = false;

  quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    // ✅ Si le QR a un montant, l'utiliser
    if (this.scanResult?.amount) {
      this.amount = this.scanResult.amount;
    }
    
    // ✅ Description par défaut
    this.description = this.scanResult?.action === 'deposit' 
      ? 'Dépôt via QR Code' 
      : 'Retrait via QR Code';
    
    // ✅ Charger les utilisateurs
    this.loadUsers();
    
    // ✅ Vérifier si c'est une transaction admin
    this.isAdminTransaction = this.scanResult?.isAdminTransaction || false;
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      },
    });
  }

  getSelectedUser(): any {
    return this.users.find((u) => u.id === this.selectedUserId);
  }

  getAmount(): number {
    return this.scanResult?.amount || this.amount || 0;
  }

  getNewBalance(): number {
    const user = this.getSelectedUser();
    if (!user) return 0;
    const currentBalance = user.balance || 0;
    const amount = this.getAmount();
    
    if (this.scanResult?.action === 'deposit') {
      return currentBalance + amount;
    } else {
      return currentBalance - amount;
    }
  }

  isBalanceInsufficient(): boolean {
    if (this.scanResult?.action === 'withdraw') {
      const user = this.getSelectedUser();
      return !user || (user.balance || 0) < this.getAmount();
    }
    return false;
  }

  isExpired(): boolean {
    if (!this.scanResult?.expiresAt) return false;
    return new Date(this.scanResult.expiresAt) < new Date();
  }

  setQuickAmount(amount: number): void {
    this.amount = amount;
  }

  submit(): void {
    // ✅ Vérifications
    if (!this.selectedUserId) {
      this.notificationService.showError('Veuillez sélectionner un utilisateur');
      return;
    }

    const amount = this.getAmount();
    if (!amount || amount < 100) {
      this.notificationService.showError('Le montant minimum est de 100 Ar');
      return;
    }

    const user = this.getSelectedUser();
    if (!user) {
      this.notificationService.showError('Utilisateur non trouvé');
      return;
    }

    if (this.isExpired()) {
      this.notificationService.showError('Ce QR Code a expiré');
      return;
    }

    if (this.scanResult?.action === 'withdraw' && user.balance < amount) {
      this.notificationService.showError(`Solde insuffisant. Solde actuel: ${this.formatAmount(user.balance)} Ar`);
      return;
    }

    const actionLabel = this.scanResult?.action === 'deposit' ? 'dépôt' : 'retrait';
    const confirmMsg = `Confirmer le ${actionLabel} de ${this.formatAmount(amount)} Ar ${this.scanResult?.action === 'deposit' ? 'sur' : 'du'} compte de ${user.firstName} ${user.lastName} ?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    this.isSubmitting = true;
    const qrData = this.scanResult ? JSON.stringify(this.scanResult) : '';
    const finalDescription = this.description || (this.scanResult?.action === 'deposit' ? 'Dépôt via QR Code' : 'Retrait via QR Code');

    if (this.scanResult?.action === 'deposit') {
      // ✅ DÉPÔT
      this.adminService.depositMoney(this.selectedUserId, amount, finalDescription, qrData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.transactionCompleted.emit({
            success: true,
            message: `💰 Dépôt de ${this.formatAmount(amount)} Ar effectué avec succès sur le compte de ${user.firstName} ${user.lastName}`,
            data: response,
          });
          this.notificationService.showSuccess(
            `💰 Dépôt de ${this.formatAmount(amount)} Ar effectué avec succès`
          );
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
      // ✅ RETRAIT
      this.adminService.withdrawMoney(this.selectedUserId, amount, finalDescription, qrData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.transactionCompleted.emit({
            success: true,
            message: `💳 Retrait de ${this.formatAmount(amount)} Ar effectué avec succès du compte de ${user.firstName} ${user.lastName}`,
            data: response,
          });
          this.notificationService.showSuccess(
            `💳 Retrait de ${this.formatAmount(amount)} Ar effectué avec succès`
          );
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

  formatAmount(amount: number | null | undefined): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  getUserInitials(user: any): string {
    if (!user) return '';
    return (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
  }
}