// frontend/src/app/components/admin/withdraw/admin-withdraw.component.ts
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AdminService, QRScanResult, QRCodeResponse } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslationService } from '../../../services/translation.service';
import { QRScannerComponent } from '../qr-scanner/qr-scanner.component';
import { QRTransactionFormComponent } from '../qr-transaction-form/qr-transaction-form.component';
import { QRGeneratorComponent } from '../qr-generator/qr-generator.component';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-admin-withdraw',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatToolbarModule,
    MatDividerModule,
    TranslatePipe,
    QRScannerComponent,
    QRTransactionFormComponent,
    QRGeneratorComponent
  ],
  templateUrl: './admin-withdraw.component.html',
  styleUrls: ['./admin-withdraw.component.css'],
})
export class AdminWithdrawComponent implements OnInit {
  users: any[] = [];
  admins: any[] = [];
  selectedUserId: string = '';
  amount: number = 0;
  description: string = '';
  isLoading = false;
  isSubmitting = false;
  isAdminWithdraw: boolean = false;
  targetAdminId: string | null = null;
  private isDestroyed = false;

  // QR Code properties
  showQRScanner: boolean = false;
  qrScanResult: QRScanResult | null = null;
  showTransactionForm: boolean = false;
  showQRGenerator: boolean = false;
  qrGeneratorType: 'deposit' | 'withdraw' = 'withdraw';

  withdrawResult: {
    success: boolean;
    message: string;
    newBalance?: number;
  } | null = null;

  quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  private cdr = inject(ChangeDetectorRef);
  private translationService = inject(TranslationService);

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.translationService.language$.subscribe(() => {
      this.safeDetectChanges();
    });
    
    this.route.queryParams.subscribe(params => {
      this.isAdminWithdraw = params['target'] === 'admin';
      this.targetAdminId = params['adminId'] || null;
      
      if (this.isAdminWithdraw) {
        this.loadAdmins();
      } else {
        this.loadUsers();
      }
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
  }

  private safeDetectChanges(): void {
    if (!this.isDestroyed) {
      try {
        this.cdr.detectChanges();
      } catch (e) {}
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.safeDetectChanges();
    
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Utilisateurs chargés:', users);
        this.users = Array.isArray(users) ? users : [];
        this.isLoading = false;
        this.safeDetectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.users = [];
        this.isLoading = false;
        this.safeDetectChanges();
      },
    });
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.safeDetectChanges();
    
    this.adminService.getAdmins().subscribe({
      next: (admins) => {
        console.log('✅ Administrateurs chargés:', admins);
        this.admins = Array.isArray(admins) ? admins : [];
        this.isLoading = false;
        
        if (this.targetAdminId) {
          const target = this.admins.find(a => a.id === this.targetAdminId);
          if (target) {
            this.selectedUserId = target.id;
          }
        }
        this.safeDetectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur chargement admins:', error);
        this.notificationService.showError('Erreur lors du chargement des administrateurs');
        this.admins = [];
        this.isLoading = false;
        this.safeDetectChanges();
      },
    });
  }

  selectQuickAmount(amount: number): void {
    this.amount = amount;
  }

  // ============================================================
  // QR CODE METHODS
  // ============================================================

  openQRGenerator(): void {
    this.qrGeneratorType = 'withdraw';
    this.showQRGenerator = true;
    this.safeDetectChanges();
  }

  closeQRGenerator(): void {
    this.showQRGenerator = false;
    this.safeDetectChanges();
  }

  onQRGenerated(response: QRCodeResponse): void {
    console.log('✅ QR Code généré:', response);
    this.notificationService.showSuccess('QR Code généré avec succès');
    setTimeout(() => {
      this.closeQRGenerator();
      this.openQRScanner();
    }, 500);
  }

  openQRScanner(): void {
    this.showQRScanner = true;
    this.qrScanResult = null;
    this.showTransactionForm = false;
    this.safeDetectChanges();
  }

  onQRScanResult(qrData: string): void {
    console.log('📥 QR Code scanné:', qrData);
    this.showQRScanner = false;
    this.safeDetectChanges();
    
    this.adminService.scanQRCode(qrData).subscribe({
      next: (result) => {
        console.log('✅ Résultat scan QR:', result);
        this.qrScanResult = result;
        this.showTransactionForm = true;
        this.safeDetectChanges();
        this.notificationService.showSuccess('QR Code scanné avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur scan QR:', error);
        this.notificationService.showError(error?.error?.message || 'QR Code invalide');
        this.safeDetectChanges();
      },
    });
  }

  closeQRScanner(): void {
    this.showQRScanner = false;
    this.safeDetectChanges();
  }

  closeTransactionForm(): void {
    this.showTransactionForm = false;
    this.qrScanResult = null;
    this.safeDetectChanges();
  }

  onTransactionCompleted(result: { success: boolean; message: string; data?: any }): void {
    console.log('✅ Transaction complétée:', result);
    this.showTransactionForm = false;
    this.qrScanResult = null;
    this.safeDetectChanges();
    if (result.success) {
      if (this.isAdminWithdraw) {
        this.loadAdmins();
      } else {
        this.loadUsers();
      }
    }
  }

  // ============================================================
  // WITHDRAW SUBMISSION
  // ============================================================

  onSubmit(): void {
    if (!this.selectedUserId) {
      this.notificationService.showError('Veuillez sélectionner un ' + (this.isAdminWithdraw ? 'administrateur' : 'utilisateur'));
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

    if (user.balance < this.amount) {
      this.notificationService.showError(
        `Solde insuffisant. Solde actuel: ${this.formatAmount(user.balance)} Ar`,
      );
      return;
    }

    if (
      !confirm(
        `Confirmer le retrait de ${this.formatAmount(this.amount)} Ar du compte de ${user.firstName} ${user.lastName} ?`,
      )
    ) {
      return;
    }

    this.isSubmitting = true;
    this.withdrawResult = null;
    this.safeDetectChanges();

    this.adminService
      .withdrawMoney(
        this.selectedUserId,
        this.amount,
        this.description || `Retrait administrateur`,
      )
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.withdrawResult = {
            success: true,
            message: `Retrait de ${this.formatAmount(this.amount)} Ar effectué avec succès`,
            newBalance: response.newBalance,
          };
          this.notificationService.showSuccess(this.withdrawResult.message);
          this.selectedUserId = '';
          this.amount = 0;
          this.description = '';
          
          if (this.isAdminWithdraw) {
            this.loadAdmins();
          } else {
            this.loadUsers();
          }
          
          setTimeout(() => {
            this.withdrawResult = null;
            this.safeDetectChanges();
          }, 5000);
          this.safeDetectChanges();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.withdrawResult = {
            success: false,
            message: error?.error?.message || 'Erreur lors du retrait',
          };
          this.notificationService.showError(this.withdrawResult.message);
          setTimeout(() => {
            this.withdrawResult = null;
            this.safeDetectChanges();
          }, 5000);
          this.safeDetectChanges();
        },
      });
  }

  getSelectedUser(): any {
    if (this.isAdminWithdraw) {
      return this.admins.find((u) => u.id === this.selectedUserId);
    }
    return this.users.find((u) => u.id === this.selectedUserId);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  getUserInitials(user: any): string {
    return (user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '');
  }

  onAmountChange(): void {
    if (this.amount && this.amount < 0) {
      this.amount = 0;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}