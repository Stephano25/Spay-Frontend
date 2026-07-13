// frontend/src/app/components/scan-pay/scan-pay.component.ts
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { Html5Qrcode } from 'html5-qrcode';
import { BaseComponent } from '../base.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

// Services
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { AdminService } from '../../services/admin.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip'; // ✅ AJOUT

@Component({
  selector: 'app-scan-pay',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule, // ✅ AJOUT
    TranslatePipe
  ],
  templateUrl: './scan-pay.component.html',
  styleUrls: ['./scan-pay.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-30px)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ transform: 'translateX(30px)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class ScanPayComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef;
  
  isScanning = true;
  showPaymentForm = false;
  scannedData: any = null;
  paymentForm: FormGroup;
  isProcessing = false;
  hasCamera = false;
  cameraError = false;
  cameraPermissionDenied = false;
  isCameraStarting = false;
  
  // Type de scan
  scanType: 'deposit' | 'withdraw' | 'payment' = 'payment';
  
  // QR Scanner
  private html5QrCode: Html5Qrcode | null = null;
  private isScanningQR = false;
  private scannerContainerId = 'qr-reader';

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
    
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(100)]],
      description: ['']
    });
  }

  override ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'deposit') {
        this.scanType = 'deposit';
      } else if (params['type'] === 'withdraw') {
        this.scanType = 'withdraw';
      } else {
        this.scanType = 'payment';
      }
      this.isScanning = true;
    });

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 ScanPayComponent: Langue changée en ${lang}`);
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.startQRScanner();
    }, 800);
  }

  override ngOnDestroy() {
    this.stopQRScanner();
    super.ngOnDestroy();
  }

  // ============================================================
  // QR SCANNER
  // ============================================================

  async startQRScanner() {
    if (this.isCameraStarting) return;
    this.isCameraStarting = true;

    try {
      const hasCamera = await this.checkCameraPermission();
      if (!hasCamera) {
        this.hasCamera = false;
        this.cameraError = true;
        this.isCameraStarting = false;
        return;
      }

      this.hasCamera = true;
      this.cameraError = false;
      this.cameraPermissionDenied = false;

      this.createScannerContainer();
      this.html5QrCode = new Html5Qrcode(this.scannerContainerId);

      const config = {
        fps: 20,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0
      };

      this.isScanningQR = true;

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        this.onScanSuccess.bind(this),
        this.onScanError.bind(this)
      );

      console.log('✅ Scanner démarré avec succès');
      this.isCameraStarting = false;

    } catch (error) {
      console.error('❌ Erreur démarrage scanner:', error);
      this.hasCamera = false;
      this.cameraError = true;
      this.isCameraStarting = false;
      
      try {
        await this.tryFallbackCamera();
      } catch {
        this.notificationService.showError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      }
    }
  }

  private async tryFallbackCamera() {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.start(
          { facingMode: 'user' },
          { fps: 15, qrbox: { width: 200, height: 200 } },
          this.onScanSuccess.bind(this),
          this.onScanError.bind(this)
        );
        console.log('✅ Scanner démarré avec caméra frontale');
        this.hasCamera = true;
        this.cameraError = false;
        this.isCameraStarting = false;
      } catch (error) {
        console.error('❌ Erreur caméra frontale:', error);
        throw error;
      }
    }
  }

  private createScannerContainer(): void {
    const oldContainer = document.getElementById(this.scannerContainerId);
    if (oldContainer) {
      oldContainer.remove();
    }

    const scannerContainer = document.getElementById('qr-scanner-container');
    if (scannerContainer) {
      scannerContainer.innerHTML = '';
      
      const readerElement = document.createElement('div');
      readerElement.id = this.scannerContainerId;
      readerElement.style.width = '100%';
      readerElement.style.maxWidth = '400px';
      readerElement.style.margin = '0 auto';
      scannerContainer.appendChild(readerElement);
    } else {
      const container = document.createElement('div');
      container.id = 'qr-scanner-container';
      container.style.width = '100%';
      container.style.maxWidth = '400px';
      container.style.margin = '0 auto';
      container.style.position = 'relative';
      container.style.borderRadius = '12px';
      container.style.overflow = 'hidden';
      container.style.background = '#000';
      container.style.minHeight = '300px';
      
      const readerElement = document.createElement('div');
      readerElement.id = this.scannerContainerId;
      readerElement.style.width = '100%';
      readerElement.style.maxWidth = '400px';
      readerElement.style.margin = '0 auto';
      container.appendChild(readerElement);
      
      const cameraPreview = document.querySelector('.camera-preview');
      if (cameraPreview) {
        cameraPreview.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.cameraPermissionDenied = true;
      }
      return false;
    }
  }

  stopQRScanner() {
    if (this.html5QrCode && this.isScanningQR) {
      try {
        this.html5QrCode.stop().catch(() => {});
        this.html5QrCode.clear();
        this.html5QrCode = null;
        this.isScanningQR = false;
      } catch (error) {
        console.error('Erreur arrêt scanner:', error);
      }
    }
  }

  onScanSuccess(decodedText: string, decodedResult: any) {
    console.log('✅ QR Code scanné avec succès:', decodedText);
    
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    this.stopQRScanner();
    this.processScannedData(decodedText);
  }

  onScanError(error: any) {
    // Ignorer les erreurs de scan
  }

  requestCameraPermission() {
    this.cameraPermissionDenied = false;
    this.cameraError = false;
    this.startQRScanner();
  }

  retryScanner() {
    this.cameraError = false;
    this.cameraPermissionDenied = false;
    this.hasCamera = false;
    this.isScanning = true;
    this.startQRScanner();
  }

  processScannedData(data: string) {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'admin_transaction') {
        this.scannedData = parsed;
        
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          this.notificationService.showWarning('Ce QR Code a expiré');
          this.isScanning = true;
          this.startQRScanner();
          return;
        }

        if (parsed.action === 'deposit' || parsed.action === 'withdraw') {
          this.scanType = parsed.action;
        }

        this.isScanning = false;
        this.showPaymentForm = true;
        
        if (parsed.amount) {
          this.paymentForm.patchValue({ amount: parsed.amount });
        }
        
        const actionLabel = this.scanType === 'deposit' ? 'Dépôt' : this.scanType === 'withdraw' ? 'Retrait' : 'Paiement';
        this.notificationService.showSuccess(`QR Code ${actionLabel} scanné avec succès`);
        
      } else if (parsed.type === 'payment' || parsed.type === 'payment_request') {
        this.scannedData = parsed;
        this.isScanning = false;
        this.showPaymentForm = true;
        this.scanType = 'payment';
        
        if (parsed.amount) {
          this.paymentForm.patchValue({ amount: parsed.amount });
        }
        
        this.notificationService.showSuccess('QR Code scanné avec succès');
      } else {
        throw new Error('Type de QR Code non reconnu');
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement QR:', error);
      this.notificationService.showError('QR Code invalide. Veuillez réessayer.');
      
      setTimeout(() => {
        this.isScanning = true;
        this.startQRScanner();
      }, 1000);
    }
  }

  processPayment() {
    if (this.paymentForm.invalid) {
      this.notificationService.showError('Veuillez remplir tous les champs');
      return;
    }

    this.isProcessing = true;
    const amount = this.paymentForm.value.amount;
    const description = this.paymentForm.value.description || '';

    if (this.scanType !== 'deposit') {
      this.walletService.checkBalance().subscribe({
        next: (balance) => {
          if (balance < amount) {
            this.notificationService.showError('Solde insuffisant');
            this.isProcessing = false;
            return;
          }
          this.executeTransaction(amount, description);
        },
        error: (error) => {
          console.error('❌ Erreur vérification solde:', error);
          this.notificationService.showError('Erreur lors de la vérification du solde');
          this.isProcessing = false;
        }
      });
    } else {
      this.executeTransaction(amount, description);
    }
  }

  executeTransaction(amount: number, description: string) {
    switch (this.scanType) {
      case 'deposit':
        this.handleDeposit(amount, description);
        break;
      case 'withdraw':
        this.handleWithdraw(amount, description);
        break;
      default:
        this.handlePayment(amount, description);
    }
  }

  private handleDeposit(amount: number, description: string) {
    if (!this.scannedData?.adminId) {
      this.notificationService.showError('QR Code de dépôt invalide');
      this.isProcessing = false;
      return;
    }

    this.adminService.depositMoney(
      this.scannedData.adminId,
      amount,
      description || 'Dépôt via QR Code'
    ).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(
          `💰 Dépôt de ${this.formatAmount(amount)} Ar effectué avec succès!`
        );
        this.isProcessing = false;
        this.resetScanner();
        this.router.navigate(['/user/wallet']);
      },
      error: (error) => {
        console.error('❌ Erreur dépôt:', error);
        this.notificationService.showError(error?.error?.message || 'Erreur lors du dépôt');
        this.isProcessing = false;
      }
    });
  }

  private handleWithdraw(amount: number, description: string) {
    if (!this.scannedData?.adminId) {
      this.notificationService.showError('QR Code de retrait invalide');
      this.isProcessing = false;
      return;
    }

    this.adminService.withdrawMoney(
      this.scannedData.adminId,
      amount,
      description || 'Retrait via QR Code'
    ).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(
          `💰 Retrait de ${this.formatAmount(amount)} Ar effectué avec succès!`
        );
        this.isProcessing = false;
        this.resetScanner();
        this.router.navigate(['/user/wallet']);
      },
      error: (error) => {
        console.error('❌ Erreur retrait:', error);
        this.notificationService.showError(error?.error?.message || 'Erreur lors du retrait');
        this.isProcessing = false;
      }
    });
  }

  private handlePayment(amount: number, description: string) {
    const receiverQrCode = this.scannedData?.qrCode || this.scannedData?.receiverId || '';

    if (!receiverQrCode) {
      this.notificationService.showError('Destinataire non trouvé dans le QR Code');
      this.isProcessing = false;
      return;
    }

    this.transactionService.scanAndPay({
      receiverQrCode: receiverQrCode,
      amount: amount,
      description: description || 'Paiement par scan'
    }).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(
          `💰 Paiement de ${this.formatAmount(amount)} Ar effectué avec succès!`
        );
        this.isProcessing = false;
        this.resetScanner();
        this.router.navigate(['/user/wallet']);
      },
      error: (error) => {
        console.error('❌ Erreur paiement:', error);
        this.notificationService.showError(error.error?.message || 'Erreur lors du paiement');
        this.isProcessing = false;
      }
    });
  }

  resetScanner() {
    this.isScanning = true;
    this.showPaymentForm = false;
    this.scannedData = null;
    this.paymentForm.reset();
    this.isProcessing = false;
    
    setTimeout(() => {
      this.startQRScanner();
    }, 500);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  getAmountIcon(amount: number): string {
    if (amount >= 100000) return 'rocket_launch';
    if (amount >= 50000) return 'star';
    if (amount >= 10000) return 'trending_up';
    return 'attach_money';
  }

  goBack() {
    this.stopQRScanner();
    this.router.navigate(['/user/dashboard']);
  }
}