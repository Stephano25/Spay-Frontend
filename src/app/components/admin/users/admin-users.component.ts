// frontend/src/app/components/admin/users/admin-users.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService, QRScanResult } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { MatDialog } from '@angular/material/dialog';
import { DepositDialogComponent } from './deposit-dialog.component';
import { QRScannerComponent } from '../qr-scanner/qr-scanner.component';
import { QRTransactionFormComponent } from '../qr-transaction-form/qr-transaction-form.component';

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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { User } from '../../../models/user.model';
import { TranslatePipe } from '../../../pipes/translate.pipe';

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
    MatMenuModule,
    MatDividerModule,
    QRScannerComponent,
    QRTransactionFormComponent,
    TranslatePipe
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;
  searchQuery = '';
  
  showQRScanner: boolean = false;
  qrScanResult: QRScanResult | null = null;
  showTransactionForm: boolean = false;
  currentQRType: 'deposit' | 'withdraw' = 'deposit';
  selectedUserForQR: User | null = null;

  // ✅ Getters avec logs pour debug
  get activeUsersCount(): number {
    const count = Array.isArray(this.users) ? this.users.filter(u => u.isActive).length : 0;
    console.log(`📊 Actifs: ${count}`);
    return count;
  }

  get inactiveUsersCount(): number {
    const count = Array.isArray(this.users) ? this.users.filter(u => !u.isActive).length : 0;
    console.log(`📊 Inactifs: ${count}`);
    return count;
  }

  get totalUsersCount(): number {
    const count = Array.isArray(this.users) ? this.users.length : 0;
    console.log(`📊 Total: ${count}`);
    return count;
  }

  private subscriptions: any[] = [];

  private avatarColors = [
    '#7c3aed', '#6d28d9', '#4f46e5', '#0891b2', 
    '#0d9488', '#059669', '#d97706', '#dc2626', 
    '#db2777', '#9333ea', '#2563eb', '#0ea5e9',
    '#14b8a6', '#8b5cf6', '#ec4899', '#f43f5e'
  ];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private translationService: TranslationService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏠 AdminUsersComponent chargé');
  }

  ngOnInit(): void {
    console.log('🔄 Initialisation AdminUsersComponent');
    this.loadUsers();

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log('🌐 AdminUsersComponent: Langue changée en ' + lang);
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUsers(): void {
    console.log('🔄 Chargement des utilisateurs...');
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.adminService.getAllUsers().subscribe({
      next: (users: User[]) => {
        console.log('✅ Utilisateurs reçus:', users);
        console.log('✅ Nombre:', users?.length || 0);
        console.log('✅ Est un tableau?', Array.isArray(users));
        
        this.users = Array.isArray(users) ? users : [];
        this.filteredUsers = this.users;
        
        console.log(`✅ ${this.totalUsersCount} utilisateurs au total`);
        console.log(`✅ ${this.activeUsersCount} utilisateurs actifs`);
        console.log(`✅ ${this.inactiveUsersCount} utilisateurs inactifs`);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.users = [];
        this.filteredUsers = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  filterUsers(): void {
    if (!Array.isArray(this.users)) {
      this.filteredUsers = [];
      return;
    }

    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredUsers = this.users;
      this.cdr.detectChanges();
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user => 
      (user.firstName || '').toLowerCase().includes(query) ||
      (user.lastName || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.phoneNumber || '').includes(query)
    );
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredUsers = Array.isArray(this.users) ? this.users : [];
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  onQRScanResult(qrData: string): void {
    this.showQRScanner = false;
    this.cdr.detectChanges();
    
    this.adminService.scanQRCode(qrData).subscribe({
      next: (result) => {
        this.qrScanResult = result;
        this.showTransactionForm = true;
        this.cdr.detectChanges();
        this.notificationService.showSuccess('QR Code scanné avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur scan QR:', error);
        this.notificationService.showError(error?.error?.message || 'QR Code invalide');
        this.cdr.detectChanges();
      },
    });
  }

  closeQRScanner(): void {
    this.showQRScanner = false;
    this.selectedUserForQR = null;
    this.cdr.detectChanges();
  }

  closeTransactionForm(): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
    this.selectedUserForQR = null;
    this.cdr.detectChanges();
  }

  onTransactionCompleted(result: { success: boolean; message: string; data?: any }): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
    this.selectedUserForQR = null;
    this.cdr.detectChanges();
    if (result.success) {
      this.loadUsers();
    }
  }

  // ============================================================
  // DÉPÔT
  // ============================================================

  depositMoney(user: User): void {
    const dialogRef = this.dialog.open(DepositDialogComponent, {
      width: '480px',
      data: { user: user },
      panelClass: 'deposit-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.adminService
          .depositMoney(user.id, result.amount, result.description)
          .subscribe({
            next: (response: any) => {
              this.notificationService.showSuccess(
                `💰 Dépôt de ${this.formatAmount(result.amount)} Ar effectué avec succès`,
              );
              this.loadUsers();
              this.cdr.detectChanges();
            },
            error: (error: any) => {
              console.error('❌ Erreur dépôt:', error);
              this.notificationService.showError(
                error?.error?.message || 'Erreur lors du dépôt',
              );
              this.cdr.detectChanges();
            },
          });
      }
    });
  }

  // ============================================================
  // RETRAIT
  // ============================================================

  withdrawMoney(user: User): void {
    if (user.balance < 100) {
      this.notificationService.showError('Solde insuffisant pour un retrait (minimum 100 Ar)');
      return;
    }

    const dialogRef = this.dialog.open(DepositDialogComponent, {
      width: '480px',
      data: { 
        user: user, 
        isWithdraw: true 
      },
      panelClass: 'deposit-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.amount > user.balance) {
          this.notificationService.showError('Solde insuffisant');
          return;
        }

        this.adminService
          .withdrawMoney(user.id, result.amount, result.description)
          .subscribe({
            next: (response: any) => {
              this.notificationService.showSuccess(
                `💰 Retrait de ${this.formatAmount(result.amount)} Ar effectué avec succès`,
              );
              this.loadUsers();
              this.cdr.detectChanges();
            },
            error: (error: any) => {
              console.error('❌ Erreur retrait:', error);
              this.notificationService.showError(
                error?.error?.message || 'Erreur lors du retrait',
              );
              this.cdr.detectChanges();
            },
          });
      }
    });
  }

  // ============================================================
  // GESTION DES UTILISATEURS
  // ============================================================

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activé' : 'désactivé';
    
    if (!confirm(`Voulez-vous vraiment ${action} l'utilisateur ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.isActive = newStatus;
        this.notificationService.showSuccess(
          `✅ Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
        );
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour statut:', error);
        this.notificationService.showError('Erreur lors de la mise à jour');
        this.cdr.detectChanges();
      },
    });
  }

  deleteUser(user: User): void {
    if (
      confirm(
        `⚠️ Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ?\nCette action est irréversible.`,
      )
    ) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = Array.isArray(this.users) ? this.users.filter((u) => u.id !== user.id) : [];
          this.filteredUsers = Array.isArray(this.filteredUsers) ? this.filteredUsers.filter((u) => u.id !== user.id) : [];
          this.notificationService.showSuccess('✅ Utilisateur supprimé avec succès');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Erreur suppression:', error);
          this.notificationService.showError('Erreur lors de la suppression');
          this.cdr.detectChanges();
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

  getAvatarColor(user: User): string {
    const name = (user.firstName || '') + (user.lastName || '');
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
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

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin':
        return 'shield';
      case 'super_admin':
        return 'star';
      default:
        return 'person';
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}