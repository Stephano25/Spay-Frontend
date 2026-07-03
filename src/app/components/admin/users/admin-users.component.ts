// frontend/src/app/components/admin/users/admin-users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService, QRScanResult } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DepositDialogComponent } from './deposit-dialog.component';

// QR Components
import { QRScannerComponent } from '../qr-scanner/qr-scanner.component';
import { QRTransactionFormComponent } from '../qr-transaction-form/qr-transaction-form.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';

import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule,
    QRScannerComponent,
    QRTransactionFormComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  
  // QR Code properties
  showQRScanner: boolean = false;
  qrScanResult: QRScanResult | null = null;
  showTransactionForm: boolean = false;
  currentQRType: 'deposit' | 'withdraw' = 'deposit';
  selectedUserForQR: User | null = null;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.isLoading = false;
        console.log('✅ Utilisateurs chargés:', this.users.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.isLoading = false;
      },
    });
  }

  // ============================================================
  // QR CODE METHODS
  // ============================================================

  openQRScanner(type: 'deposit' | 'withdraw', user: User): void {
    this.currentQRType = type;
    this.selectedUserForQR = user;
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
    this.selectedUserForQR = null;
  }

  closeTransactionForm(): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
    this.selectedUserForQR = null;
  }

  onTransactionCompleted(result: { success: boolean; message: string; data?: any }): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
    this.selectedUserForQR = null;
    if (result.success) {
      this.loadUsers();
    }
  }

  // ============================================================
  // DÉPÔT AVEC DIALOGUE
  // ============================================================

  depositMoney(user: User): void {
    const dialogRef = this.dialog.open(DepositDialogComponent, {
      width: '480px',
      data: { user: user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.adminService
          .depositMoney(user.id, result.amount, result.description)
          .subscribe({
            next: (response: any) => {
              this.notificationService.showSuccess(
                `Dépôt de ${this.formatAmount(result.amount)} Ar effectué avec succès`,
              );
              this.loadUsers();
            },
            error: (error: any) => {
              console.error('❌ Erreur dépôt:', error);
              this.notificationService.showError(
                error?.error?.message || 'Erreur lors du dépôt',
              );
            },
          });
      }
    });
  }

  // ============================================================
  // RETRAIT AVEC DIALOGUE
  // ============================================================

  withdrawMoney(user: User): void {
    if (user.balance < 100) {
      this.notificationService.showError('Solde insuffisant pour un retrait');
      return;
    }

    const amount = prompt(
      `Entrez le montant à retirer pour ${user.firstName} ${user.lastName} (max: ${this.formatAmount(user.balance)} Ar)`,
    );

    if (!amount) return;

    const withdrawAmount = parseInt(amount, 10);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      this.notificationService.showError('Montant invalide');
      return;
    }

    if (withdrawAmount > user.balance) {
      this.notificationService.showError('Solde insuffisant');
      return;
    }

    if (
      !confirm(
        `Confirmer le retrait de ${this.formatAmount(withdrawAmount)} Ar du compte de ${user.firstName} ${user.lastName} ?`,
      )
    ) {
      return;
    }

    this.adminService
      .withdrawMoney(user.id, withdrawAmount, `Retrait administrateur`)
      .subscribe({
        next: (response: any) => {
          this.notificationService.showSuccess(
            `Retrait de ${this.formatAmount(withdrawAmount)} Ar effectué avec succès`,
          );
          this.loadUsers();
        },
        error: (error: any) => {
          console.error('❌ Erreur retrait:', error);
          this.notificationService.showError(
            error?.error?.message || 'Erreur lors du retrait',
          );
        },
      });
  }

  // ============================================================
  // GESTION DES UTILISATEURS
  // ============================================================

  toggleUserStatus(user: User): void {
    this.adminService.updateUserStatus(user.id, !user.isActive).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.notificationService.showSuccess(
          `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`,
        );
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour statut:', error);
        this.notificationService.showError('Erreur lors de la mise à jour');
      },
    });
  }

  deleteUser(user: User): void {
    if (
      confirm(
        `Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ? Cette action est irréversible.`,
      )
    ) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter((u) => u.id !== user.id);
          this.notificationService.showSuccess('Utilisateur supprimé');
        },
        error: (error) => {
          console.error('❌ Erreur suppression:', error);
          this.notificationService.showError('Erreur lors de la suppression');
        },
      });
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  getUserInitials(user: User): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'Utilisateur';
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}